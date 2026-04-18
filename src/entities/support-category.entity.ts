import { Entity, PrimaryColumn, Column, OneToMany, DeleteDateColumn } from 'typeorm';
import { SupportRequest } from './support-request.entity';

@Entity({ name: 'support_categories' })
export class SupportCategory {
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @Column({ type: 'text', nullable: true })
  name_de?: string;

  @Column({ type: 'text', nullable: true })
  name_ar?: string;

  @Column({ type: 'text', nullable: true })
  name_en?: string;

  @OneToMany(() => SupportRequest, (sr) => sr.category)
  supportRequests?: SupportRequest[];

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
