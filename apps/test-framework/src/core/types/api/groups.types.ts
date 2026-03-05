import { UUIdEntryDto } from './common.types';
import { UserApiEntity } from './users.types';

// ============ Entity Types ============

export interface GroupApiEntity {
  id: string;
  name: string;
  owner: UserApiEntity;
  members: UserApiEntity[];
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

export type GetAllGroupsResponse = GroupApiEntity[];

export interface GetGroupResponse extends GroupApiEntity {}

export interface CreateGroupResponse extends GroupApiEntity {
  inviteCode: string;
}

export interface UpdateGroupResponse extends GroupApiEntity {}

export type DeleteGroupResponse = void;

export type LeaveGroupResponse = void;

export interface RegenerateInviteResponse {
  inviteCode: string;
}

export type JoinGroupResponse = void;

export type BlockUserResponse = void;

export type UnblockUserResponse = void;

export interface GetBlockedUsersResponse {
  blockedUsers: UserApiEntity[];
}
