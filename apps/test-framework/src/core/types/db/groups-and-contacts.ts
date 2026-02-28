export interface GroupDbEntity {
  id: string;
  name: string;
  ownerId?: string;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactDbEntity {
  id: string;
  ownerId: string;
  targetId: string;
  alias: string;
  createdAt: Date;
  updatedAt: Date;
}