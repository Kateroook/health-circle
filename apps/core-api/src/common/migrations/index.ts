import { CreateEntities1762501994652 } from './1762501994652-create-entities';
import { AlterEntities1762550449323 } from './1762550449323-alter-entities';
import { CreateSystemLogsEntity1762593436251 } from './1762593436251-create-system-logs-entity';
import { CreateDataLogsEntity1762594452409 } from './1762594452409-create-data-logs-entity';
import { AlterUserEntity1762595585393 } from './1762595585393-alter-user-entity';
import { AlterUserSessionEntity1762598640398 } from './1762598640398-alter-user-session-entity';
import { AlterSystemLogEntity1762792680021 } from './1762792680021-alter-system-log-entity';
import { AlterGroupEntity1763486277896 } from './1763486277896-alter-group-entity';
import { AddDeleteAccountUserActivity1763845792981 } from './1763845792981-add-delete-account-user-activity';
import { AlterGroupEntity1763903271836 } from './1763903271836-alter-group-entity';
import { CreateExternalFilesEntity1763916392841 } from './1763916392841-create-external-files-entity';
import { AddUserStatus1764020197638 } from './1764020197638-add-user-status';
import { AlterUserEntity1764228077216 } from './1764228077216-alter-user-entity';
import { CreateConfirmationCodeEntity1769962454307 } from './1769962454307-create-confirmation-code-entity';
import { AlterUserUniqueness1771007170534 } from './1771007170534-alter-user-uniqueness';
import { AddAvatarUpdatedAtToUser1771090489116 } from './1771090489116-add-avatar-updated-at-to-user';
import { RemoveAvatars1771168550000 } from './1771168550000-remove-avatars';
import { AddContactsAndFullName1771181633191 } from './1771181633191-add-contacts-and-full-name';
import { AddGroupBlockList1771186507666 } from './1771186507666-add-group-block-list';
import { CascadeDeleteAndRelaxLogConstraints1772048762122 } from './1772048762122-CascadeDeleteAndRelaxLogConstraints';

export const migrations = [
  CreateEntities1762501994652,
  AlterEntities1762550449323,
  CreateSystemLogsEntity1762593436251,
  CreateDataLogsEntity1762594452409,
  AlterUserEntity1762595585393,
  AlterUserSessionEntity1762598640398,
  AlterSystemLogEntity1762792680021,
  AlterGroupEntity1763486277896,
  AddDeleteAccountUserActivity1763845792981,
  AlterGroupEntity1763903271836,
  CreateExternalFilesEntity1763916392841,
  AddUserStatus1764020197638,
  AlterUserEntity1764228077216,
  CreateConfirmationCodeEntity1769962454307,
  AlterUserUniqueness1771007170534,
  AddAvatarUpdatedAtToUser1771090489116,
  RemoveAvatars1771168550000,
  AddContactsAndFullName1771181633191,
  AddGroupBlockList1771186507666,
  CascadeDeleteAndRelaxLogConstraints1772048762122,
];
