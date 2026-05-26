import type { ReactNode } from 'react';

export type EntityRowState = 'clean' | 'added' | 'modified' | 'deleted';

export type EntityListColumnType = 'text' | 'number' | 'select' | 'checkbox' | 'switch' | 'action';

export interface EntityListSelectOption {
  label: string;
  value: string | number;
}

export interface EntityListChangeSet<TItem> {
  added: TItem[];
  modified: Array<{
    original: TItem;
    current: TItem;
  }>;
  deleted: TItem[];
}

export interface EntityListManagedRow<TItem> {
  clientId: string;
  original?: TItem;
  current: TItem;
  state: EntityRowState;
  dirtyFields: string[];
  errors: Record<string, string>;
}

export interface EntityListCellContext<TItem, TValue> {
  row: TItem;
  rows: TItem[];
  value: TValue;
  rowState: EntityRowState;
  isEditing: boolean;
  disabled: boolean;
  error?: string;
  update: (value: TValue) => void;
}

export interface EntityListRowActionContext<TItem> {
  row: TItem;
  rowState: EntityRowState;
  isEditing: boolean;
  disabled: boolean;
}

export interface EntityListExtraRowActionContext<TItem extends { id?: number; order: number }> {
  row: EntityListManagedRow<TItem>;
  rows: EntityListManagedRow<TItem>[];
  updateRow: (clientId: string, updater: (row: TItem, rows: TItem[]) => TItem) => void;
}

interface EntityListBaseColumn {
  id: string;
  title: string;
  className?: string;
  headerClassName?: string;
  mobileLabel?: string;
}

export interface EntityListFieldColumn<
  TItem,
  TField extends Extract<keyof TItem, string> = Extract<keyof TItem, string>,
> extends EntityListBaseColumn {
  type: Exclude<EntityListColumnType, 'action'>;
  field: TField;
  placeholder?: string;
  options?: EntityListSelectOption[];
  editable?: boolean | ((row: TItem) => boolean);
  required?: boolean;
  render?: (context: EntityListCellContext<TItem, TItem[TField]>) => ReactNode;
  editor?: (context: EntityListCellContext<TItem, TItem[TField]>) => ReactNode;
  validate?: (value: TItem[TField], row: TItem, rows: TItem[]) => string | null;
}

export interface EntityListActionColumn<TItem> extends EntityListBaseColumn {
  type: 'action';
  render: (context: EntityListRowActionContext<TItem>) => ReactNode;
}

export type EntityListColumn<TItem> =
  | EntityListFieldColumn<TItem>
  | EntityListActionColumn<TItem>;

export interface EntityListAddControlContext<
  TItem extends { id?: number; order: number },
  TAddContext,
> {
  rows: EntityListManagedRow<TItem>[];
  onAdd: (context?: TAddContext) => void;
}

export interface EntityListProps<TItem extends { id?: number; order: number }, TAddContext = void> {
  title: string;
  description: string;
  itemLabel: string;
  columns: EntityListColumn<TItem>[];
  createEmptyItem: (
    nextOrder: number,
    context?: TAddContext,
    rows?: EntityListManagedRow<TItem>[],
  ) => TItem;
  fetchItems: () => Promise<TItem[]>;
  saveItems: (items: TItem[], changes: EntityListChangeSet<TItem>) => Promise<void>;
  getItemName: (item: TItem) => string;
  validateRow?: (row: TItem, rows: TItem[]) => Record<string, string>;
  getRowClassName?: (row: TItem, state: EntityRowState) => string;
  emptyMessage?: string;
  renderAddControl?: (context: EntityListAddControlContext<TItem, TAddContext>) => ReactNode;
  renderRowActions?: (context: EntityListExtraRowActionContext<TItem>) => ReactNode;
  tree?: {
    getRowId: (row: TItem) => number | string | undefined;
    getParentId: (row: TItem) => number | string | null | undefined;
    getDepth?: (row: TItem) => number;
    draggable?: boolean;
  };
}
