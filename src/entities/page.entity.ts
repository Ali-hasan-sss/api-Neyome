import { Entity, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity({ name: 'pages' })
export class Page {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'jsonb', nullable: true })
  cards?: any;

  @Column({ type: 'jsonb', nullable: true })
  content?: any;

  @Column({ type: 'jsonb', nullable: true })
  locales?: any;

  @Column({ type: 'text', nullable: true })
  type?: string;

  @Column({ type: 'text', nullable: true })
  version?: string;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
