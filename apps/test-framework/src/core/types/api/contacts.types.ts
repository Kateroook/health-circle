import { UUIdEntryDto } from './common.types';
import { UserEntity } from './users.types';

// ============ Entity Types ============

export interface ContactEntity {
  id: string;
  owner: UserEntity;
  ownerId: string;
  target: UserEntity;
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

export type GetAllContactsResponse = ContactEntity[];

export interface CreateContactResponse extends ContactEntity {}

export interface UpdateContactResponse extends ContactEntity {}

export type DeleteContactResponse = void;

export interface SetContactAliasResponse extends Record<string, any> {}