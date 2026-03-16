import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

import { GroupMemberEntity } from './group-member.entity';

@Entity({ name: 'group' })
export class GroupEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @OneToMany(() => GroupMemberEntity, (membership) => membership.group, { cascade: true })
  members: GroupMemberEntity[];

  @Column({ type: 'varchar', length: 32, nullable: true, unique: true })
  inviteCode: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastRollCallAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
