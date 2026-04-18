import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity({ name: 'task_types' })
export class TaskType {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  // FK: task_types.familyId -> families.id
  @ManyToOne(() => Family, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @Column({ type: 'text', nullable: true })
  emoji?: string;

  @Column({ type: 'text', nullable: true })
  createdBy?: string;

  @Column({ type: 'bigint', nullable: true })
  sortOrder?: string | number;

  @Column({ type: 'jsonb', nullable: true })
  title?: any;

  @Column({ type: 'boolean', nullable: true })
  isActive?: boolean;

  @Column({ type: 'text', nullable: true })
  key?: string;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
