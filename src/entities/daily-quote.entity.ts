import { Entity, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';

@Entity({ name: 'daily_quotes' })
export class DailyQuote {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
