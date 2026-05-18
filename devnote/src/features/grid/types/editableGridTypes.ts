import type { ReactNode } from 'react';

import type { GridRowState } from './gridTypes';

export type EditableGridColumnType = 'text' | 'number' | 'select' | 'checkbox' | 'switch' | 'action';

export interface EditableGridSelectOption {
  label: string;
  value: string | number;
}

export interface EditableGridChangeSet<TItem> {
  added: TItem[];
  modified: Array<{
    original: TItem;
    current: TItem;
  }>;
  deleted: TItem[];
}

export interface EditableGridManagedRow<TItem> {
  clientId: string;
  original?: TItem;
  current: TItem;
  state: GridRowState;
  dirtyFields: string[];
  errors: Record<string, string>;
}

export interface EditableGridCellContext<TItem, TValue> {
  row: TItem;
  value: TValue;
  rowState: GridRowState;
  isEditing: boolean;
  disabled: boolean;
  error?: string;
  update: (value: TValue) => void;
  commit: () => void;
}

export interface EditableGridRowActionContext<TItem> {
  row: TItem;
  rowState: GridRowState;
  isEditing: boolean;
  disabled: boolean;
}

interface EditableGridBaseColumn {
  id: string;
  title: string;
  className?: string;
  headerClassName?: string;
}

export interface EditableGridFieldColumn<
  TItem,
  TField extends Extract<keyof TItem, string> = Extract<keyof TItem, string>,
> extends EditableGridBaseColumn {
  type: Exclude<EditableGridColumnType, 'action'>;
  field: TField;
  placeholder?: string;
  options?: EditableGridSelectOption[];
  editable?: boolean | ((row: TItem) => boolean);
  required?: boolean;
  render?: (context: EditableGridCellContext<TItem, TItem[TField]>) => ReactNode;
  editor?: (context: EditableGridCellContext<TItem, TItem[TField]>) => ReactNode;
  validate?: (value: TItem[TField], row: TItem, rows: TItem[]) => string | null;
}

export interface EditableGridActionColumn<TItem> extends EditableGridBaseColumn {
  type: 'action';
  render: (context: EditableGridRowActionContext<TItem>) => ReactNode;
}

export type EditableGridColumn<TItem> =
  | EditableGridFieldColumn<TItem>
  | EditableGridActionColumn<TItem>;

export interface EditableGridProps<TItem extends { id?: number; order: number }> {
  title: string;
  description: string;
  itemLabel: string;
  columns: EditableGridColumn<TItem>[];
  createEmptyItem: (nextOrder: number) => TItem;
  fetchItems: () => Promise<TItem[]>;
  saveItems: (items: TItem[], changes: EditableGridChangeSet<TItem>) => Promise<void>;
  getItemName: (item: TItem) => string;
  validateRow?: (row: TItem, rows: TItem[]) => Record<string, string>;
  getRowClassName?: (row: TItem, state: GridRowState) => string;
}
