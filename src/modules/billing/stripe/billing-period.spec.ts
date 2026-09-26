import { addStripeBillingPeriod } from './billing-period';

describe('addStripeBillingPeriod', () => {
  it('keeps the clock time and moves one calendar month', () => {
    const start = new Date('2026-03-15T10:30:00.000Z');
    expect(addStripeBillingPeriod(start, 'month').toISOString()).toBe('2026-04-15T10:30:00.000Z');
  });

  it('clamps a monthly period to the last day of a short month', () => {
    expect(addStripeBillingPeriod(new Date('2026-01-31T08:00:00.000Z'), 'month').toISOString()).toBe(
      '2026-02-28T08:00:00.000Z',
    );
    expect(addStripeBillingPeriod(new Date('2024-01-31T08:00:00.000Z'), 'month').toISOString()).toBe(
      '2024-02-29T08:00:00.000Z',
    );
  });

  it('adds one calendar year and clamps 29 Feb', () => {
    expect(addStripeBillingPeriod(new Date('2026-03-15T10:30:00.000Z'), 'year').toISOString()).toBe(
      '2027-03-15T10:30:00.000Z',
    );
    expect(addStripeBillingPeriod(new Date('2024-02-29T12:00:00.000Z'), 'year').toISOString()).toBe(
      '2025-02-28T12:00:00.000Z',
    );
  });
});
