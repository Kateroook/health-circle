import { UserEntity } from 'src/common/entities/user.entity';
import { ConfirmationTypes } from 'src/confirmations/enums/confirmation-type';
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('confirmation_codes')
export class ConfirmationCodeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  code: string;

  @Column({ type: 'enum', enum: ConfirmationTypes })
  type: ConfirmationTypes;

  @Column()
  expiresAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  user: UserEntity;
}
