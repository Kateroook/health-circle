import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('external_files')
export class ExternalFilesEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  fileName: string;

  @Column({ type: 'text', unique: true, update: false })
  externalId: string;

  @Column({ type: 'text' })
  md5: string;

  @Column({ type: 'int', update: false })
  size: number;

  @Column('text')
  mimetype?: string;

  @Column({ type: 'timestamptz', nullable: true })
  unlinkAt: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz' })
  deletedAt: Date;
}
