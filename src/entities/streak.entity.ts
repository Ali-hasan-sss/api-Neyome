import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'streaks' })
export class Streak {
  @PrimaryColumn({ type: 'uuid' })
  id: string; // userId as key in export

  @Column({ type: 'integer', nullable: true })
  count?: number;

  @Column({ type: 'integer', nullable: true })
  maxCount?: number;

  @Column({ type: 'boolean', nullable: true })
  lastWasOnTime?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastActiveDate?: Date;

  @OneToOne(() => User, (user) => user.streak, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'id', referencedColumnName: 'id' })
  user?: User;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
