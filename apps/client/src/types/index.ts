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
