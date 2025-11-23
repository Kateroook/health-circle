import { AddDeleteAccountUserActivity1763845792981 } from 'src/database/migrations/1763845792981-add-delete-account-user-activity';
import { AlterGroupEntity1763903271836 } from 'src/database/migrations/1763903271836-alter-group-entity';
import { CreateEntities1762501994652 } from './1762501994652-create-entities';
import { AlterEntities1762550449323 } from './1762550449323-alter-entities';
import { CreateSystemLogsEntity1762593436251 } from './1762593436251-create-system-logs-entity';
import { CreateDataLogsEntity1762594452409 } from './1762594452409-create-data-logs-entity';
import { AlterUserEntity1762595585393 } from './1762595585393-alter-user-entity';
import { AlterUserSessionEntity1762598640398 } from './1762598640398-alter-user-session-entity';
import { AlterSystemLogEntity1762792680021 } from './1762792680021-alter-system-log-entity';
import { AlterGroupEntity1763486277896 } from './1763486277896-alter-group-entity';

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
];
