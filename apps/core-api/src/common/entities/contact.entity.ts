import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity({ name: 'contacts' })
@Index(['owner', 'target'], { unique: true })
export class ContactEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: UserEntity;

  @Column()
  ownerId: string;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_id' })
  target: UserEntity;

  @Column()
  targetId: string;

  @Column({ type: 'varchar', length: 255 })
  alias: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
