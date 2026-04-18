import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Family } from './family.entity';
import { User } from './user.entity';
import { Task } from './task.entity';

@Entity({ name: 'point_ledger' })
export class PointLedger {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'integer', nullable: true })
  amount?: number;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  @ManyToOne(() => Family, (family) => family.pointLedgers, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.pointLedgers, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ type: 'uuid', nullable: true })
  refTaskId?: string;

  @ManyToOne(() => Task, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'refTaskId' })
  refTask?: Task;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
