import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
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

  @Column({ type: 'boolean', nullable: true })
  earned?: boolean;

  @Column({ type: 'integer', nullable: true })
  pointsUsed?: number;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.claimedRewards, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
