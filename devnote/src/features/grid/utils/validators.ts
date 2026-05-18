import type { GridValidator } from '../types/gridTypes';

export function requiredValidator<TValue>(
  message = 'This field is required.',
): GridValidator<TValue, unknown> {
  return (value) => {
    if (value === null || value === undefined) {
      return message;
    }

    if (typeof value === 'string' && value.trim().length === 0) {
      return message;
    }

    return null;
  };
}

export function maxLengthValidator(
  maxLength: number,
  message = `Must be ${maxLength} characters or less.`,
): GridValidator<string, unknown> {
  return (value) => {
    if (typeof value !== 'string') {
      return null;
    }

    return value.trim().length > maxLength ? message : null;
  };
}
