import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { In, Repository } from 'typeorm';

import { QueueService } from '../common/queue/queue.service';
import { FirestoreSyncService } from '../notifications/firestore-sync.service';
import { NotificationType } from '../notifications/notification-types';
import { NotificationsService } from '../notifications/notifications.service';
import { UserEntity } from '../users/entities/user.entity';
import { AlertsRegionEntity } from './entities/alerts-region.entity';

interface Alert {
  id: number;
  location_title: string;
  location_type: string;
  started_at: string;
  finished_at: string | null;
  updated_at: string;
  location_uid: number;
  location_oblast: string;
  location_raion: string | null;
  notes: string | null;
  calculated: boolean;
  alert_type: string;
}

@Injectable()
export class AlertsService implements OnModuleInit {
  private readonly logger = new Logger(AlertsService.name);
  private activeAlertUids: Set<number> = new Set();
  private activeAlertsByUid: Map<number, Alert> = new Map();
  private hasInitialSyncCompleted = false;
  private readonly apiUrl = 'https://api.alerts.in.ua/v1/alerts/active.json';
  private regionHierarchy: Map<number, number[]> = new Map(); // parentUid -> childrenUids[]

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AlertsRegionEntity)
    private readonly regionRepository: Repository<AlertsRegionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly firestoreSyncService: FirestoreSyncService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing AlertsService with pg-boss...');
    await this.loadRegionHierarchy();
    await this.queueService.schedule('sync-alerts', '* * * * *');
    await this.queueService.work('sync-alerts', () => this.syncAlerts());
    // Do an initial fetch to populate in-memory state (avoid push-spam on restart).
    await this.syncAlerts(true);
  }

  private async loadRegionHierarchy() {
    try {
      // The CSV is ordered: Oblast -> Raions -> Hromadas.
      // We can infer parents by looking at the last seen Oblast/Raion.
      const csvPath = path.resolve(__dirname, '../../assets/alerts_regions.csv');
      if (!fs.existsSync(csvPath)) {
        this.logger.warn('CSV not found for hierarchy building');
        return;
      }
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.split('\n');

      let currentOblastUid: number | null = null;
      let currentRaionUid: number | null = null;

      for (let i = 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [uidStr, , type] = line.split(',');
        const uid = parseInt(uidStr);
        if (isNaN(uid)) continue;

        if (type === 'Область' || type === 'Місто з спеціальним статусом') {
          currentOblastUid = uid;
          currentRaionUid = null;
        } else if (type === 'Район') {
          currentRaionUid = uid;
          if (currentOblastUid) {
            this.addChild(currentOblastUid, uid);
          }
        } else if (type === 'Громада') {
          if (currentRaionUid) {
            this.addChild(currentRaionUid, uid);
          } else if (currentOblastUid) {
            this.addChild(currentOblastUid, uid);
          }
        }
      }
      this.logger.log('Region hierarchy built');
    } catch (err) {
      this.logger.error(`Failed to load hierarchy: ${err.message}`);
    }
  }

  private addChild(parent: number, child: number) {
    const children = this.regionHierarchy.get(parent) || [];
    children.push(child);
    this.regionHierarchy.set(parent, children);
  }

  async syncAlerts(isInitialSync = false) {
    try {
      const token = this.configService.get<string>('ALERTS_TOKEN');
      if (!token) {
        this.logger.error('ALERTS_TOKEN is not configured');
        return;
      }

      const response = await fetch(this.apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as { alerts: Alert[] };
      const currentAlerts = data.alerts || [];
      const currentUids = new Set(currentAlerts.map((a) => a.location_uid));
      const currentByUid = new Map(currentAlerts.map((a) => [a.location_uid, a] as const));

      if (!this.hasInitialSyncCompleted) {
        this.activeAlertUids = currentUids;
        this.activeAlertsByUid = currentByUid;
        this.hasInitialSyncCompleted = true;
        this.logger.log(`Initial alerts sync completed. Active alerts: ${currentUids.size}`);
        return;
      }

      if (isInitialSync) {
        this.activeAlertUids = currentUids;
        this.activeAlertsByUid = currentByUid;
        this.logger.log(`Re-populated alerts state. Active alerts: ${currentUids.size}`);
        return;
      }

      const previousUids = this.activeAlertUids;
      const previousByUid = this.activeAlertsByUid;

      // Detect new / ended / updated alerts
      const newUids = [...currentUids].filter((uid) => !previousUids.has(uid));
      const endedUids = [...previousUids].filter((uid) => !currentUids.has(uid));
      const updatedUids = [...currentUids].filter((uid) => {
        if (!previousUids.has(uid)) return false;
        const prev = previousByUid.get(uid);
        const curr = currentByUid.get(uid);
        // Only signal if the actual type changed or updated_at changed significantly
        return prev?.alert_type !== curr?.alert_type || prev?.updated_at !== curr?.updated_at;
      });

      if (newUids.length > 0) {
        this.logger.log(`Detected ${newUids.length} new alerts: ${newUids.join(', ')}`);
        for (const uid of newUids) {
          const alert = currentByUid.get(uid);
          if (alert) await this.processNewAlert(alert);
        }
      }

      if (endedUids.length > 0) {
        this.logger.log(`Detected ${endedUids.length} ended alerts: ${endedUids.join(', ')}`);
        await this.signalUsersInRegions(endedUids);
      }

      if (updatedUids.length > 0) {
        this.logger.log(`Detected ${updatedUids.length} updated alerts: ${updatedUids.join(', ')}`);
        await this.signalUsersInRegions(updatedUids);
      }

      this.activeAlertUids = currentUids;
      this.activeAlertsByUid = currentByUid;
    } catch (err) {
      this.logger.error(`Failed to sync alerts: ${err.message}`);
    }
  }

  private async processNewAlert(alert: Alert) {
    const users = await this.findUsersInHierarchy(alert.location_uid);
    const tokens = users.map((u) => u.fcmToken).filter(Boolean) as string[];

    if (tokens.length > 0) {
      this.logger.log(`Sending alerts to ${tokens.length} users in region ${alert.location_title}`);
      await this.notificationsService.sendMulticastByType(
        tokens,
        NotificationType.AIR_ALERT,
        {
          regionName: alert.location_title,
          alertType: this.mapAlertType(alert.alert_type),
        },
        {
          alertId: alert.id.toString(),
          locationUid: alert.location_uid.toString(),
        },
      );
    }

    // Let clients update dashboards in real time
    await this.firestoreSyncService.sendSyncSignal(users.map((u) => u.id));
  }

  private async getAllAffectedRegionUids(rootUid: number): Promise<number[]> {
    const result: number[] = [rootUid];
    const queue = [rootUid];

    while (queue.length > 0) {
      const parent = queue.shift()!;
      const children = this.regionHierarchy.get(parent) || [];
      for (const child of children) {
        if (!result.includes(child)) {
          result.push(child);
          queue.push(child);
        }
      }
    }
    return result;
  }

  private async findUsersInHierarchy(alertUid: number): Promise<UserEntity[]> {
    // 1. If alert is for parent (Oblast) -> we must notify users in all children (Raion, Hromada)
    const descendants = await this.getAllAffectedRegionUids(alertUid);

    // 2. If alert is for child (Hromada) -> we must notify users in all parents (Raion, Oblast)
    // To do this, we find all UIDs that have this alertUid as a descendant.
    const ancestors: number[] = [];
    for (const [parent, children] of this.regionHierarchy.entries()) {
      if (children.includes(alertUid)) {
        ancestors.push(parent);
        // Recursively find parents of this parent
        let curr = parent;
        let found = true;
        while (found) {
          found = false;
          for (const [p, c] of this.regionHierarchy.entries()) {
            if (c.includes(curr)) {
              ancestors.push(p);
              curr = p;
              found = true;
              break;
            }
          }
        }
      }
    }

    const allUids = Array.from(new Set([...descendants, ...ancestors]));
    return this.userRepository.find({
      where: { alertRegionUid: In(allUids) },
      select: ['id', 'fcmToken', 'firstName', 'lastName'],
    });
  }

  private mapAlertType(type: string): string {
    switch (type) {
      case 'air_raid':
        return 'Повітряна тривога';
      case 'artillery_shelling':
        return 'Загроза артобстрілу';
      case 'urban_fights':
        return 'Вуличні бої';
      case 'chemical_danger':
        return 'Хімічна небезпека';
      case 'nuclear_danger':
        return 'Ядерна небезпека';
      default:
        return 'Тривога';
    }
  }

  getActiveAlerts() {
    return Array.from(this.activeAlertUids);
  }

  async getMyAlertStatus(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'alertRegionUid'],
    });

    if (!user) {
      return { active: false, userAlertRegionUid: null, alert: null };
    }

    const uid = user.alertRegionUid;
    if (!uid) {
      return { active: false, userAlertRegionUid: null, alert: null };
    }

    const alert = this.activeAlertsByUid.get(uid);
    if (!alert) {
      return { active: false, userAlertRegionUid: uid, alert: null };
    }

    return {
      active: true,
      userAlertRegionUid: uid,
      alert: {
        id: alert.id,
        locationUid: alert.location_uid,
        regionName: alert.location_title,
        alertType: this.mapAlertType(alert.alert_type),
        alertTypeRaw: alert.alert_type,
        startedAt: alert.started_at,
        updatedAt: alert.updated_at,
      },
    };
  }

  async getRegions() {
    // Return a flat list of all regions for the client's search/autocomplete UI
    return this.regionRepository.find({
      order: { name: 'ASC' },
      select: ['uid', 'name', 'type'],
    });
  }

  private async signalUsersInRegions(regionUids: number[]) {
    if (regionUids.length === 0) return;

    const allUsers: UserEntity[] = [];
    for (const uid of regionUids) {
      const users = await this.findUsersInHierarchy(uid);
      allUsers.push(...users);
    }

    const uniqueUserIds = Array.from(new Set(allUsers.map((u) => u.id)));
    if (uniqueUserIds.length > 0) {
      await this.firestoreSyncService.sendSyncSignal(uniqueUserIds);
    }
  }
}
