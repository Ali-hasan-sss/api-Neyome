import { Entity, PrimaryColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Family } from './family.entity';
import { Task } from './task.entity';
import { Reward } from './reward.entity';
import { PointLedger } from './point-ledger.entity';
import { Streak } from './streak.entity';
import { ClaimedReward } from './claimed-reward.entity';
import { UserSetting } from './user-setting.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'boolean', nullable: true })
  isParent?: boolean;

  @Column({ type: 'boolean', default: false })
  isAdmin?: boolean;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true, select: false })
  password?: string;

  @Column({ type: 'text', nullable: true, select: false })
  magicLinkToken?: string;

  @Column({ type: 'timestamptz', nullable: true })
  magicLinkExpiresAt?: Date;

  @Column({ type: 'text', nullable: true, select: false })
  passwordResetOtp?: string;

  @Column({ type: 'timestamptz', nullable: true })
  passwordResetOtpExpiresAt?: Date;

  /** New email awaiting OTP verification (change-email flow). */
  @Column({ type: 'text', nullable: true, select: false })
  pendingEmail?: string | null;

  @Column({ type: 'text', nullable: true, select: false })
  emailChangeOtp?: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  emailChangeOtpExpiresAt?: Date | null;

  @Column({ type: 'integer', nullable: true })
  emojiOption?: number;

  @Column({ type: 'text', nullable: true })
  profileImageUrl?: string;

  @Column({ type: 'integer', nullable: true })
  points?: number;

  @Column({ type: 'integer', nullable: true })
  age?: number;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  @Column({ type: 'text', nullable: true })
  locale?: string;

  @Column({ type: 'text', nullable: true })
  familyCode?: string;

  @Column({ type: 'text', nullable: true, select: false })
  pinHash?: string;

  /** AES-GCM ciphertext (base64url); only for children under 6 when PIN was set — parent recovery via API. */
  @Column({ type: 'text', nullable: true, select: false })
  devicePinEnc?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  badges?: any;

  @Column({ type: 'jsonb', nullable: true })
  fcmTokens?: any;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  @ManyToOne(() => Family, (family) => family.users, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @OneToMany(() => Task, (task) => task.assignee)
  tasks?: Task[];

  @OneToMany(() => Reward, (reward) => reward.user)
  rewards?: Reward[];

  @OneToMany(() => PointLedger, (pl) => pl.user)
  pointLedgers?: PointLedger[];

  // One streak row per user, keyed by same id
  // Note: relation is optional if streak record is missing
  @OneToOne(() => Streak, (streak) => streak.user)
  streak?: Streak;

  @OneToMany(() => ClaimedReward, (cr) => cr.user)
  claimedRewards?: ClaimedReward[];

  @OneToOne(() => UserSetting, (us) => us.user)
  userSetting?: UserSetting;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
