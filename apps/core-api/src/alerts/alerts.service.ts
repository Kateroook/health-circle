import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
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
    await this.queueService.schedule('sync-alerts', '* * * * *');
    await this.queueService.work('sync-alerts', () => this.syncAlerts());
    // Do an initial fetch to populate in-memory state (avoid push-spam on restart).
    await this.syncAlerts(true);
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
      const currentAlerts = data.alerts;
      const currentUids = new Set(currentAlerts.map((a) => a.location_uid));
      const currentByUid = new Map(currentAlerts.map((a) => [a.location_uid, a] as const));

      if (!this.hasInitialSyncCompleted || isInitialSync) {
        this.activeAlertUids = currentUids;
        this.activeAlertsByUid = currentByUid;
        this.hasInitialSyncCompleted = true;
        this.logger.log(`Initial alerts sync completed. Active alerts: ${currentUids.size}`);
        return;
      }

      const previousUids = this.activeAlertUids;
      const previousByUid = this.activeAlertsByUid;

      // Detect new / ended / updated alerts
      const newUids = [...currentUids].filter((uid) => !previousUids.has(uid));
      const endedUids = [...previousUids].filter((uid) => !currentUids.has(uid));
      const updatedUids = [...currentUids].filter((uid) => {
        if (!previousUids.has(uid)) return false;
        return previousByUid.get(uid)?.updated_at !== currentByUid.get(uid)?.updated_at;
      });

      if (newUids.length > 0) {
        this.logger.log(`Detected ${newUids.length} new alerts: ${newUids.join(', ')}`);
        for (const uid of newUids) {
          const alert = currentByUid.get(uid);
          if (alert) await this.processNewAlert(alert);
        }
        await this.signalUsersInRegions(newUids);
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
    // 1. Find all regions affected by this alert (the region itself and all its children)
    const affectedRegionUids = await this.getAllAffectedRegionUids(alert.location_uid);

    // 2. Find users in these regions
    const users = await this.userRepository.find({
      where: { alertRegionUid: In(affectedRegionUids) },
      select: ['id', 'fcmToken', 'firstName', 'lastName'],
    });

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

    // Let clients update dashboards in real time (if they listen to Firestore `user_sync/{userId}`).
    await this.firestoreSyncService.sendSyncSignal(users.map((u) => u.id));
  }

  private async getAllAffectedRegionUids(rootUid: number): Promise<number[]> {
    // Exact match only since the hierarchy from the source CSV was unreliable.
    return [rootUid];
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

    const users = await this.userRepository.find({
      where: { alertRegionUid: In(regionUids) },
      select: ['id'],
    });
    const userIds = users.map((u) => u.id);
    await this.firestoreSyncService.sendSyncSignal(userIds);
  }
}
