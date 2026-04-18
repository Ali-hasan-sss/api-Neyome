import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, DeleteDateColumn } from 'typeorm';
import { Family } from './family.entity';
import { User } from './user.entity';
import { PointLedger } from './point-ledger.entity';

@Entity({ name: 'tasks' })
export class Task {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'boolean', nullable: true })
  completed?: boolean;

  @Column({ type: 'text', nullable: true })
  status?: string;

  @Column({ type: 'integer', nullable: true })
  points?: number;

  @Column({ type: 'text', nullable: true })
  tz?: string;

  @Column({ type: 'jsonb', nullable: true })
  reminders?: any;

  @Column({ type: 'text', nullable: true })
  taskType?: string;

  @Column({ type: 'text', nullable: true })
  taskTypeKey?: string;

  @Column({ type: 'timestamptz', nullable: true })
  date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dueAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt?: Date;

  @Column({ type: 'text', nullable: true })
  assigneeName?: string;

  @Column({ type: 'text', nullable: true })
  completedByName?: string;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  @ManyToOne(() => Family, (family) => family.tasks, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string;

  @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User;

  @Column({ type: 'text', nullable: true })
  completedBy?: string;

  @Column({ type: 'text', nullable: true })
  submittedBy?: string;

  @OneToMany(() => PointLedger, (pl) => pl.refTask)
  pointLedgers?: PointLedger[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
