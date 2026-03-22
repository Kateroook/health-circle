import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In,Repository } from 'typeorm';

import { QueueService } from '../common/queue/queue.service';
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
  private readonly apiUrl = 'https://api.alerts.in.ua/v1/alerts/active.json';

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(AlertsRegionEntity)
    private readonly regionRepository: Repository<AlertsRegionEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly queueService: QueueService,
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing AlertsService with pg-boss...');
    await this.queueService.schedule('sync-alerts', '* * * * *');
    await this.queueService.work('sync-alerts', () => this.syncAlerts());
  }

  async syncAlerts() {
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

      // Detect new alerts
      const newUids = [...currentUids].filter((uid) => !this.activeAlertUids.has(uid));

      if (newUids.length > 0) {
        this.logger.log(`Detected ${newUids.length} new alerts: ${newUids.join(', ')}`);
        for (const uid of newUids) {
          const alert = currentAlerts.find((a) => a.location_uid === uid);
          if (alert) {
            await this.processNewAlert(alert);
          }
        }
      }

      this.activeAlertUids = currentUids;
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

  async getRegions() {
    // Return a flat list of all regions for the client's search/autocomplete UI
    return this.regionRepository.find({
      order: { name: 'ASC' },
      select: ['uid', 'name', 'type'],
    });
  }
}
