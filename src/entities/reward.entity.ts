import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'rewards' })
export class Reward {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'integer', nullable: true })
  points?: number;

  @Column({ type: 'boolean', nullable: true })
  earned?: boolean;

  @Column({ type: 'boolean', nullable: true })
  fulfilled?: boolean;

  @Column({ type: 'integer', nullable: true })
  progress?: number;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dayClaimed?: Date;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @ManyToOne(() => User, (user) => user.rewards, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
