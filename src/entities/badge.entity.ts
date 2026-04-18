import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { Family } from './family.entity';

@Entity({ name: 'badges' })
export class Badge {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'uuid', nullable: true })
  familyId?: string;

  // FK: badges.familyId -> families.id
  @ManyToOne(() => Family, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'familyId' })
  family?: Family;

  @Column({ type: 'text', nullable: true })
  emoji?: string;

  @Column({ type: 'jsonb', nullable: true })
  description?: any;

  @Column({ type: 'integer', nullable: true })
  threshold?: number;

  @Column({ type: 'jsonb', nullable: true })
  title?: any;

  @Column({ type: 'text', nullable: true })
  trigger?: string;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
