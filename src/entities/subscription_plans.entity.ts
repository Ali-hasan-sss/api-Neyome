import { Entity, PrimaryColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';

@Entity({ name: 'Subscription_plans' })
export class SubscriptionPlans {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'integer', nullable: true })
  limitsVersion?: number;

  @Column({ type: 'jsonb', nullable: true })
  limits?: any;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
