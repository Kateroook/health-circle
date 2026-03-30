export type UserStatus = "SAFE" | "DANGER" | "UNKNOWN" | "WAS_SAFE";

export interface User {
  id: string;
  email: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName?: string;
  phone: string;
  avatarUpdatedAt?: string;
  status: UserStatus;
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
}

export interface Member {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  fullName?: string;
  avatarUpdatedAt?: string;
  status: UserStatus;
  active?: boolean; // Used in selection lists
  isAlias?: boolean; // Used when a custom name is set for a member
  latitude?: number;
  longitude?: number;
  region?: string;
  district?: string;
  phone?: string;
  lastStatusUpdate?: string;
}

export interface Circle {
  id: string;
  name: string;
  inviteCode: string;
  owner: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  members: Member[];
}

export type ActiveAlert = {
  id: number;
  locationUid: number;
  regionName: string;
  alertType: string;
  alertTypeRaw: string;
  startedAt: string;
  updatedAt: string;
};

export type MyAlertStatus = {
  active: boolean;
  userAlertRegionUid: number | null;
  alert: ActiveAlert | null;
};
