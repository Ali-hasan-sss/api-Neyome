import { Entity, PrimaryColumn, Column, DeleteDateColumn } from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity({ name: 'subscription_plans' })
export class SubscriptionPlan {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @PrimaryColumn({ type: 'uuid' })
  id: string;

  @ApiPropertyOptional({
    description: 'Badge text in all languages (e.g., Popular, Recommended)',
    example: { en: 'Popular', ar: 'الأكثر شيوعاً', de: 'Beliebt' }
  })
  @Column({ type: 'jsonb', nullable: true })
  badge?: any;

  @ApiPropertyOptional({
    description: 'Features list in all languages',
    example: {
      en: ['Up to 10 family members', 'Unlimited tasks'],
      ar: ['حتى 10 أفراد من العائلة', 'مهام غير محدودة'],
      de: ['Bis zu 10 Familienmitglieder', 'Unbegrenzte Aufgaben']
    }
  })
  @Column({ type: 'jsonb', nullable: true })
  features?: any;

  @ApiPropertyOptional({ example: 'prod_1234567890', description: 'Stripe product ID (set automatically on save)' })
  @Column({ type: 'text', nullable: true })
  productId?: string | null;

  @ApiPropertyOptional({
    description: 'Plan subtitle in all languages',
    example: { en: 'Perfect for growing families', ar: 'مثالي للعائلات المتنامية', de: 'Perfekt für wachsende Familien' }
  })
  @Column({ type: 'jsonb', nullable: true })
  subtitle?: any;

  @ApiPropertyOptional({ example: 9.99, description: 'Display price set by admin (marketing/landing page)' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number | null;

  @ApiPropertyOptional({ example: 'USD', description: 'ISO 4217 currency code (e.g. USD, EUR, SAR)' })
  @Column({ type: 'varchar', length: 3, nullable: true, default: 'USD' })
  currency?: string | null;

  @ApiPropertyOptional({ example: 1, description: 'Sort order (lower = first). Highlighted plan typically has sort=1' })
  @Column({ type: 'integer', nullable: true })
  sort?: number;

  @ApiPropertyOptional({
    description: 'Plan title in all languages',
    example: { en: 'Family Pro', ar: 'العائلة برو', de: 'Familie Pro' }
  })
  @Column({ type: 'jsonb', nullable: true })
  title?: any;

  @ApiPropertyOptional({
    description: 'Period short text in all languages (e.g., /month, /year)',
    example: { en: '/month', ar: '/شهر', de: '/Monat' }
  })
  @Column({ type: 'jsonb', nullable: true })
  periodShort?: any;

  @ApiPropertyOptional({ example: 1, description: 'Limits version number' })
  @Column({ type: 'integer', nullable: true })
  limitsVersion?: number;

  @ApiPropertyOptional({
    description: 'Plan limits (users, tasks, etc.)',
    example: { users: 10, tasks: 1000, rewards: 50 }
  })
  @Column({ type: 'jsonb', nullable: true })
  limits?: any;

  @ApiPropertyOptional()
  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt?: Date;
}
