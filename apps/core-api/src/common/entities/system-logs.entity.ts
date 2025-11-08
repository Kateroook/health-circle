import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: '_logs' })
export class SystemLogEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'int' })
  levelCode: number;

  @Column({ type: 'varchar', length: 255 })
  hostname: string;

  @Column({ type: 'varchar', length: 1024 })
  msg: string;

  @Column({ type: 'int' })
  pid: number;

  @Index()
  @CreateDateColumn({ type: 'timestamptz' })
  time: Date;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'int', nullable: true })
  statusCode: number | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  path: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  func: string | null;

  @Column({ type: 'jsonb', nullable: true })
  stack: object | null;

  @Column({ type: 'jsonb', nullable: true })
  data: object | null;

  @Column({ type: 'varchar', length: 255, nullable: true, default: 'other' })
  typeCode: string;
}
