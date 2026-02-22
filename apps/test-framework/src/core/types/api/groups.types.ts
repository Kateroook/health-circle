import { UUIdEntryDto } from './common.types';
import { UserEntity } from './users.types';

// ============ Entity Types ============

export interface GroupEntity {
  id: string;
  name: string;
  owner: UserEntity;
  members: UserEntity[];
  inviteCode: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ DTOs ============

export interface CreateGroupDto {
  name: string;
}

export interface UpdateGroupDto {
  id: string;
  members: UUIdEntryDto[];
  name?: string;
}

export interface JoinGroupDto {
  code: string;
}

// ============ Request Types ============

export interface GetAllGroupsRequest {}

export interface GetGroupRequest {
  id: string;
}

export interface CreateGroupRequest extends CreateGroupDto {}

export interface UpdateGroupRequest extends UpdateGroupDto {}

export interface DeleteGroupRequest {
  id: string;
}

export interface LeaveGroupRequest {
  id: string;
}

export interface RegenerateInviteRequest {
  id: string;
}

export interface JoinGroupRequest extends JoinGroupDto {}

export interface BlockUserRequest {
  id: string;
  userId: string;
}

export interface UnblockUserRequest {
  id: string;
  userId: string;
}

export interface GetBlockedUsersRequest {
  id: string;
}

// ============ Response Types ============

export type GetAllGroupsResponse = GroupEntity[];

export interface GetGroupResponse extends GroupEntity {}

export interface CreateGroupResponse extends GroupEntity {
  inviteCode: string;
}

export interface UpdateGroupResponse extends GroupEntity {}

export type DeleteGroupResponse = void;

export type LeaveGroupResponse = void;

export interface RegenerateInviteResponse {
  inviteCode: string;
}

export type JoinGroupResponse = void;

export type BlockUserResponse = void;

export type UnblockUserResponse = void;

export interface GetBlockedUsersResponse {
  blockedUsers: UserEntity[];
}