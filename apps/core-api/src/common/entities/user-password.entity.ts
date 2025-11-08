import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, RelationId } from 'typeorm';

import { UserEntity } from './user.entity';

@Entity({ name: 'user_passwords' })
export class UserPasswordEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @RelationId((row: UserPasswordEntity) => row.user)
  userId: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @Index()
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;
}
