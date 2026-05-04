import { Baseline1773479991424 } from './1773479991424-baseline';
import { AddLocationColumns1773502191466 } from './1773502191466-add-location-columns';
import { AddJoinedAtToGroupMembers1773516929000 } from './1773516929000-add-joined-at-to-group-members';
import { NotificationsSettings1773696757253 } from './1773696757253-notifications-settings';
import { AddRegions1774169922439 } from './1774169922439-add-regions';
import { Sync1774372858185 } from './1774372858185-sync';
import { AddSmsCode1776864317358 } from './1776864317358-add-sms-code';
import { SetupPostgisGeocoding1776864317359 } from './1776864317359-setup-postgis-geocoding';
import { SeedAlertsRegionsMapping1776864317361 } from './1776864317361-seed-alerts-regions-mapping';
import { SeedRegionsFix17748970886980 } from './17748970886980-seed-regions-fix';

export const migrations = [
  Baseline1773479991424,
  AddLocationColumns1773502191466,
  AddJoinedAtToGroupMembers1773516929000,
  NotificationsSettings1773696757253,
  AddRegions1774169922439,
  Sync1774372858185,
  SeedRegionsFix17748970886980,
  AddSmsCode1776864317358,
  SetupPostgisGeocoding1776864317359,
  SeedAlertsRegionsMapping1776864317361,
];
