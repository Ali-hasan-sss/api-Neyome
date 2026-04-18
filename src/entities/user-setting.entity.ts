import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'user_settings' })
export class UserSetting {
  @PrimaryColumn({ type: 'uuid' })
  id: string; // user id key

  @Column({ type: 'boolean', nullable: true })
  marketing?: boolean;

  @Column({ type: 'boolean', nullable: true })
  rewardApproved?: boolean;

  @Column({ type: 'boolean', nullable: true })
  pushEnabled?: boolean;

  @Column({ type: 'text', nullable: true })
  dailyReminder?: string;

  @Column({ type: 'boolean', nullable: true })
  taskAssigned?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  updatedAt?: Date;

  @OneToOne(() => User, (user) => user.userSetting, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'id', referencedColumnName: 'id' })
  user?: User;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
