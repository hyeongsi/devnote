import type { ReactNode } from 'react';

export type GridRowState = 'clean' | 'added' | 'modified' | 'deleted';

export type GridPrimitiveValue = string | number | boolean | null | undefined;

export type GridValueFormatter<TValue, TRow> = (value: TValue, row: TRow) => string;

export type GridValidator<TValue, TRow> = (
  value: TValue,
  row: TRow,
  rows: TRow[],
) => string | null;

export interface GridSelectOption<TValue extends GridPrimitiveValue = string | number> {
  label: string;
  value: TValue;
}

export interface GridCellRenderContext<TRow, TValue> {
  row: TRow;
  value: TValue;
  rowState?: GridRowState;
}

export interface GridColumnBase<TRow> {
  id: string;
  headerName: string;
  width?: number | string;
  editable?: boolean | ((row: TRow) => boolean);
  className?: string;
}

export interface GridFieldColumn<
  TRow,
  TField extends Extract<keyof TRow, string> = Extract<keyof TRow, string>,
> extends GridColumnBase<TRow> {
  kind?: 'field';
  field: TField;
  required?: boolean;
  placeholder?: string;
  options?: GridSelectOption[];
  formatter?: GridValueFormatter<TRow[TField], TRow>;
  validator?: GridValidator<TRow[TField], TRow>;
  render?: (context: GridCellRenderContext<TRow, TRow[TField]>) => ReactNode;
}

export interface GridActionColumn<TRow> extends GridColumnBase<TRow> {
  kind: 'action';
  render: (context: GridCellRenderContext<TRow, undefined>) => ReactNode;
}

export type GridColumn<TRow> = GridFieldColumn<TRow> | GridActionColumn<TRow>;

export interface GridManagedRow<TRow> {
  original?: TRow;
  current: TRow;
  state: GridRowState;
  dirtyFields: string[];
  errors: Record<string, string>;
}
