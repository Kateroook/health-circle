import { UUIdEntryDto } from './common.types';
import { UserApiEntity } from './users.types';

// ============ Entity Types ============

export interface ContactApiEntity {
  id: string;
  owner: UserApiEntity;
  ownerId: string;
  target: UserApiEntity;
  targetId: string;
  alias: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============ DTOs ============

export interface CreateContactDto {
  target: UUIdEntryDto;
  alias: string;
}

export interface UpdateContactDto {
  target?: UUIdEntryDto;
  alias?: string;
}

export interface SetContactAliasDto {
  alias?: string;
}

// ============ Request Types ============

export interface GetAllContactsRequest {}

export interface CreateContactRequest extends CreateContactDto {}

export interface UpdateContactRequest {
  targetId: string;
  body: UpdateContactDto;
}

export interface DeleteContactRequest {
  targetId: string;
}

export interface SetContactAliasRequest {
  targetId: string;
  body: SetContactAliasDto;
}

// ============ Response Types ============

export type GetAllContactsResponse = ContactApiEntity[];

export interface CreateContactResponse extends ContactApiEntity {}

export interface UpdateContactResponse extends ContactApiEntity {}

export type DeleteContactResponse = void;

export interface SetContactAliasResponse extends Record<string, any> {}
