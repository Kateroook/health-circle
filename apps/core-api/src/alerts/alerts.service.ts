import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserStatus } from '../common/enums/user-status';
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
  private uidToPcode: Map<number, string> = new Map();
  private readonly apiUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AlertsRegionEntity)
    private readonly regionRepository: Repository<AlertsRegionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly firestoreSyncService: FirestoreSyncService,
    private readonly queueService: QueueService,
  ) {
    this.apiUrl = this.configService.get<string>('ALERTS_API_URL') || 'http://localhost:3001/v1/alerts/active.json';
  }

  async onModuleInit() {
    this.logger.log('Initializing AlertsService with pg-boss...');
    await this.loadRegionPcodes();
    await this.queueService.schedule('sync-alerts', '* * * * *');
    await this.queueService.work('sync-alerts', () => this.syncAlerts());
    // Do an initial fetch to populate in-memory state (avoid push-spam on restart).
    await this.syncAlerts(true);
  }

  private async loadRegionPcodes() {
    const regions = await this.regionRepository.find({ select: ['uid', 'hdx_pcode'] });
    for (const r of regions) {
      if (r.hdx_pcode) this.uidToPcode.set(r.uid, r.hdx_pcode);
    }
    this.logger.log(`Loaded ${this.uidToPcode.size} region P-codes for prefix matching.`);
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

    // Automatically degrade safety status for SAFE users in the affected region
    const usersToDegrade = users.filter((u) => u.status === UserStatus.SAFE);
    if (usersToDegrade.length > 0) {
      this.logger.log(`Degrading status for ${usersToDegrade.length} users in region ${alert.location_title} due to air alert`);
      await Promise.all(
        usersToDegrade.map((u) =>
          this.userRepository.update({ id: u.id }, { status: UserStatus.WAS_SAFE, lastStatusUpdate: new Date() }),
        ),
      );
    }

    // Let clients update dashboards in real time (after DB updates)
    await this.firestoreSyncService.sendSyncSignal(users.map((u) => u.id));
  }

  private async findUsersInHierarchy(alertUid: number): Promise<UserEntity[]> {
    const region = await this.regionRepository.findOne({ where: { uid: alertUid } });
    if (!region || !region.hdx_pcode) {
      this.logger.warn(`Region ${alertUid} not found or has no hdx_pcode. Cannot find affected users.`);
      return [];
    }

    // Prefix-based matching: userPcode.startsWith(alertPcode)
    // In SQL: ar.hdx_pcode LIKE 'alertPcode%'
    return this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.alertRegion', 'ar')
      .where('ar.hdx_pcode LIKE :prefix', { prefix: `${region.hdx_pcode}%` })
      .select(['user.id', 'user.fcmToken', 'user.firstName', 'user.lastName', 'user.status'])
      .getMany();
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
      relations: ['alertRegion'],
      select: {
        id: true,
        alertRegionUid: true,
        alertRegion: {
          uid: true,
          hdx_pcode: true,
        },
      },
    });

    if (!user) {
      return { active: false, userAlertRegionUid: null, alert: null };
    }

    const uid = user.alertRegionUid;
    const userPcode = user.alertRegion?.hdx_pcode;
    if (!uid || !userPcode) {
      return { active: false, userAlertRegionUid: uid, alert: null };
    }

    // Find if any active alert's P-code is a prefix of the user's P-code
    let activeAlert: Alert | undefined;
    for (const [alertUid, alert] of this.activeAlertsByUid.entries()) {
      const alertPcode = this.uidToPcode.get(alertUid);
      if (alertPcode && userPcode.startsWith(alertPcode)) {
        activeAlert = alert;
        break;
      }
    }

    if (!activeAlert) {
      return { active: false, userAlertRegionUid: uid, alert: null };
    }

    return {
      active: true,
      userAlertRegionUid: uid,
      alert: {
        id: activeAlert.id,
        locationUid: activeAlert.location_uid,
        regionName: activeAlert.location_title,
        alertType: this.mapAlertType(activeAlert.alert_type),
        alertTypeRaw: activeAlert.alert_type,
        startedAt: activeAlert.started_at,
        updatedAt: activeAlert.updated_at,
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

    const prefixes = regionUids.map((uid) => this.uidToPcode.get(uid)).filter(Boolean) as string[];
    if (prefixes.length === 0) return;

    // Single query for all users whose region P-code starts with any of the prefixes
    const query = this.userRepository.createQueryBuilder('user').innerJoin('user.alertRegion', 'ar').select(['user.id']);

    prefixes.forEach((prefix, index) => {
      if (index === 0) {
        query.where('ar.hdx_pcode LIKE :prefix' + index, { ['prefix' + index]: `${prefix}%` });
      } else {
        query.orWhere('ar.hdx_pcode LIKE :prefix' + index, { ['prefix' + index]: `${prefix}%` });
      }
    });

    const users = await query.getMany();

    const userIds = users.map((u) => u.id);
    if (userIds.length > 0) {
      await this.firestoreSyncService.sendSyncSignal(userIds);
    }
  }
}
