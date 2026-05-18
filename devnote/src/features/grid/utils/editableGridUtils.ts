import type {
  EditableGridChangeSet,
  EditableGridFieldColumn,
  EditableGridManagedRow,
} from '../types/editableGridTypes';
import { createManagedGridRow } from './rowState';

export function createEditableGridRowId() {
  return `grid-row-${crypto.randomUUID()}`;
}

export function createEditableGridRow<TItem>(item: TItem): EditableGridManagedRow<TItem> {
  const base = createManagedGridRow(item);

  return {
    ...base,
    clientId: createEditableGridRowId(),
  };
}

export function buildEditableGridChangeSet<TItem>(
  rows: EditableGridManagedRow<TItem>[],
): EditableGridChangeSet<TItem> {
  return rows.reduce<EditableGridChangeSet<TItem>>(
    (accumulator, row) => {
      if (row.state === 'added') {
        accumulator.added.push(row.current);
      }

      if (row.state === 'modified' && row.original) {
        accumulator.modified.push({
          original: row.original,
          current: row.current,
        });
      }

      if (row.state === 'deleted' && row.original) {
        accumulator.deleted.push(row.original);
      }

      return accumulator;
    },
    {
      added: [],
      modified: [],
      deleted: [],
    },
  );
}

export function resolveEditableGridColumn<TItem>(
  column: EditableGridFieldColumn<TItem>,
  row: TItem,
) {
  if (typeof column.editable === 'function') {
    return column.editable(row);
  }

  return column.editable ?? true;
}

export function getEditableGridValueLabel<
  TItem,
  TField extends Extract<keyof TItem, string>,
>(column: EditableGridFieldColumn<TItem, TField>, value: TItem[TField]) {
  if (column.type === 'select') {
    const matched = column.options?.find((option) => option.value === value);
    return matched?.label ?? String(value ?? '');
  }

  if (column.type === 'checkbox') {
    return value === true ? 'Checked' : 'Unchecked';
  }

  return String(value ?? '');
}

export function coerceEditableGridValue<
  TItem,
  TField extends Extract<keyof TItem, string>,
>(column: EditableGridFieldColumn<TItem, TField>, value: unknown) {
  if (column.type === 'number') {
    return (value === '' || value === null || value === undefined ? 0 : Number(value)) as TItem[TField];
  }

  if (column.type === 'checkbox' || column.type === 'switch') {
    return Boolean(value) as TItem[TField];
  }

  if (column.type === 'select') {
    const matched = column.options?.find((option) => String(option.value) === String(value));
    return (matched?.value ?? value) as TItem[TField];
  }

  return (typeof value === 'string' ? value : String(value ?? '')) as TItem[TField];
}
