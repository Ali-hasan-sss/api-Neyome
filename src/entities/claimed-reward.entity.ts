import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'claimed_rewards' })
export class ClaimedReward {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'timestamptz', nullable: true })
  claimedAt?: Date;

  @Column({ type: 'text', nullable: true })
  rewardName?: string;

  @Column({ type: 'uuid', nullable: true })
  rewardId?: string; // reference to rewards.id

  @Column({ type: 'boolean', nullable: true })
  approved?: boolean;

  /** pending | approved | rejected. Null on older rows means pending unless approved is true. */
  @Column({ type: 'text', nullable: true })
  status?: string | null;

  @Column({ type: 'boolean', nullable: true })
  earned?: boolean;

  @Column({ type: 'integer', nullable: true })
  pointsUsed?: number;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  /** Family of the requesting child, copied at claim time so parents can list/approve per family. */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  familyId?: string | null;

  @ManyToOne(() => User, (user) => user.claimedRewards, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
