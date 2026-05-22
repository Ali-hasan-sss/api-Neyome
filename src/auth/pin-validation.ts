import { BadRequestException } from '@nestjs/common';

/** Standard 4-digit numeric PIN for children older than 6. */
export const NUMERIC_PIN_REGEX = /^\d{4}$/;

/** Grapheme count for emoji / symbol PIN (children age 6 and under). */
export function pinGraphemeCount(pin: string): number {
  return [...pin].length;
}

export function isYoungChild(age: number | undefined | null): boolean {
  return age != null && age <= 6;
}

export function isOlderChild(age: number | undefined | null): boolean {
  return age != null && age > 6;
}

/**
 * Validates PIN format for child age rules:
 * - age > 6: exactly 4 digits (0-9)
 * - age <= 6: exactly 4 characters (emoji PIN allowed)
 * - age omitted: if pin sent, accept either format
 */
export function assertPinFormatForAge(pin: string, age: number | undefined | null): void {
  if (isOlderChild(age)) {
    if (!NUMERIC_PIN_REGEX.test(pin)) {
      throw new BadRequestException('PIN must be exactly 4 digits for children older than 6');
    }
    return;
  }

  if (isYoungChild(age)) {
    if (pinGraphemeCount(pin) !== 4) {
      throw new BadRequestException(
        'PIN must be exactly 4 characters (emoji PIN) for children age 6 or under',
      );
    }
    return;
  }

  if (NUMERIC_PIN_REGEX.test(pin)) return;
  if (pinGraphemeCount(pin) === 4) return;
  throw new BadRequestException('PIN must be 4 digits or 4 emoji/characters');
}

export function assertPinRequiredForAge(pin: string | undefined, age: number | undefined | null): void {
  if (isOlderChild(age) && !pin) {
    throw new BadRequestException('PIN is required for children older than 6');
  }
}
