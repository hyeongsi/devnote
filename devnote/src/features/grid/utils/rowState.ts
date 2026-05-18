import type { GridManagedRow, GridRowState } from '../types/gridTypes';

function sanitizeComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeComparable(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
        accumulator[key] = sanitizeComparable(entry);
        return accumulator;
      }, {});
  }

  return typeof value === 'string' ? value.trim() : value;
}

export function isSameGridValue(left: unknown, right: unknown) {
  return JSON.stringify(sanitizeComparable(left)) === JSON.stringify(sanitizeComparable(right));
}

export function areGridRowsEqual<TRow>(left: TRow, right: TRow) {
  return isSameGridValue(left, right);
}

export function getDirtyGridFields<TRow extends object>(original: TRow | undefined, current: TRow) {
  if (!original) {
    return Object.keys(current as Record<string, unknown>);
  }

  const keys = new Set([
    ...Object.keys(original as Record<string, unknown>),
    ...Object.keys(current as Record<string, unknown>),
  ]);

  return Array.from(keys).filter((key) => {
    const originalValue = (original as Record<string, unknown>)[key];
    const currentValue = (current as Record<string, unknown>)[key];
    return !isSameGridValue(originalValue, currentValue);
  });
}

export function deriveGridRowState<TRow extends object>(
  original: TRow | undefined,
  current: TRow,
  previousState: GridRowState,
) {
  if (previousState === 'deleted') {
    return 'deleted';
  }

  if (!original) {
    return 'added';
  }

  return areGridRowsEqual(original, current) ? 'clean' : 'modified';
}

export function createManagedGridRow<TRow>(item: TRow): GridManagedRow<TRow> {
  return {
    original: { ...item },
    current: { ...item },
    state: 'clean',
    dirtyFields: [],
    errors: {},
  };
}
