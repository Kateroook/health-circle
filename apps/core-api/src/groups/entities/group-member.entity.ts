import { CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { UserEntity } from '../../users/entities/user.entity';
import { GroupEntity } from './group.entity';

@Entity({ name: 'group_members' })
@Index(['groupId', 'userId'], { unique: true })
export class GroupMemberEntity {
  @PrimaryColumn('uuid', { name: 'group_id' })
  groupId: string;

  @PrimaryColumn('uuid', { name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => GroupEntity, (group) => group.members, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'group_id' })
  group: GroupEntity;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt: Date;
}
