import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, DeleteDateColumn } from 'typeorm';
import { SupportCategory } from './support-category.entity';

@Entity({ name: 'support_requests' })
export class SupportRequest {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'timestamptz', nullable: true })
  createdAt?: Date;

  @Column({ type: 'text', nullable: true })
  attachmentUrl?: string | null;

  @Column({ type: 'text', nullable: true })
  name?: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'text', nullable: true })
  categoryName?: string;

  @Column({ type: 'text', nullable: true })
  email?: string;

  @Column({ type: 'uuid', nullable: true })
  categoryId?: string;

  // FK: support_requests.categoryId -> support_categories.id
  @ManyToOne(() => SupportCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category?: SupportCategory;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
