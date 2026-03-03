import { ConfirmationCodeDbEntity, ExternalFileDbEntity } from '../types/db/codes-and-files';
import { ContactDbEntity, GroupDbEntity } from '../types/db/groups-and-contacts';
import { UserDbEntity, UserPasswordDbEntity, UserSessionDbEntity } from '../types/db/user-entities';
export interface Database {
  users: UserDbEntity;
  user_passwords: UserPasswordDbEntity;
  user_sessions: UserSessionDbEntity;
  group: GroupDbEntity;
  confirmation_codes: ConfirmationCodeDbEntity;
  external_files: ExternalFileDbEntity;
  contacts: ContactDbEntity;
}
