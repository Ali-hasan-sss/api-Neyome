import { Entity, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity({ name: 'support_faqs' })
export class SupportFaq {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'jsonb', nullable: true })
  question?: any;

  @Column({ type: 'jsonb', nullable: true })
  answer?: any;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
