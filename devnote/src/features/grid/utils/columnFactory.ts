import type { GridActionColumn, GridFieldColumn } from '../types/gridTypes';

export function createGridColumn<
  TRow,
  TField extends Extract<keyof TRow, string> = Extract<keyof TRow, string>,
>(column: GridFieldColumn<TRow, TField>) {
  return {
    kind: 'field' as const,
    ...column,
  };
}

export function createGridActionColumn<TRow>(column: GridActionColumn<TRow>) {
  return column;
}
