import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity({ name: 'rewards_list' })
export class RewardList {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  // FK: rewards_list.familyId -> families.id
  @ManyToOne(() => Family, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  icon?: string;

  @Column({ type: 'integer', nullable: true })
  points?: number;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  parentId?: string;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
