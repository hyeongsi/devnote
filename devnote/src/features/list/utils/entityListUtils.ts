import type {
  EntityListChangeSet,
  EntityListFieldColumn,
  EntityListManagedRow,
  EntityRowState,
} from '../types/entityListTypes';

export function createEntityListRowId() {
  return `entity-row-${crypto.randomUUID()}`;
}

export function isSameEntityValue(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function getDirtyEntityFields<TItem extends object>(original: TItem | undefined, current: TItem) {
  if (!original) {
    return Object.keys(current);
  }

  return Object.keys(current).filter((field) => {
    const key = field as keyof TItem;
    return !isSameEntityValue(original[key], current[key]);
  });
}

export function deriveEntityRowState<TItem extends object>(
  original: TItem | undefined,
  current: TItem,
  previousState: EntityRowState,
): EntityRowState {
  if (previousState === 'added' || previousState === 'deleted') {
    return previousState;
  }

  if (!original) {
    return 'added';
  }

  return isSameEntityValue(original, current) ? 'clean' : 'modified';
}

export function createEntityListRow<TItem>(item: TItem): EntityListManagedRow<TItem> {
  return {
    clientId: createEntityListRowId(),
    original: item,
    current: item,
    state: 'clean',
    dirtyFields: [],
    errors: {},
  };
}

export function buildEntityListChangeSet<TItem>(
  rows: EntityListManagedRow<TItem>[],
): EntityListChangeSet<TItem> {
  return rows.reduce<EntityListChangeSet<TItem>>(
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

export function resolveEntityListColumn<
  TItem,
  TField extends Extract<keyof TItem, string>,
>(
  column: EntityListFieldColumn<TItem, TField>,
  row: TItem,
) {
  if (typeof column.editable === 'function') {
    return column.editable(row);
  }

  return column.editable ?? true;
}

export function getEntityListValueLabel<
  TItem,
  TField extends Extract<keyof TItem, string>,
>(column: EntityListFieldColumn<TItem, TField>, value: TItem[TField]) {
  if (column.type === 'select') {
    const matched = column.options?.find((option) => option.value === value);
    return matched?.label ?? String(value ?? '');
  }

  if (column.type === 'checkbox') {
    return value === true ? 'Checked' : 'Unchecked';
  }

  return String(value ?? '');
}

export function coerceEntityListValue<
  TItem,
  TField extends Extract<keyof TItem, string>,
>(column: EntityListFieldColumn<TItem, TField>, value: unknown) {
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
