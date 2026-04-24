export interface ActiveAlertDto {
  id: number;
  locationUid: number;
  regionName: string;
  alertType: string;
  alertTypeRaw: string;
  startedAt: string;
  updatedAt: string;
}

export interface MyAlertStatusDto {
  active: boolean;
  userAlertRegionUid: number | null;
  alert: ActiveAlertDto | null;
}

export interface AlertsRegionEntity {
  uid: number;
  name: string;
  type: string;
}
