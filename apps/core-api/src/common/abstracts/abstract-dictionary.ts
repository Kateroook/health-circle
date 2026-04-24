import { Column, PrimaryColumn } from 'typeorm';

export class AbstractDictionary<T extends string | void = void> {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  code: T extends string ? T : string;

  @Column({ type: 'varchar', length: 255 })
  label?: string;
}
