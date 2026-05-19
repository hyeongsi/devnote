import type { EntityListColumn, EntityListFieldColumn } from '../types/entityListTypes';

export function isEntityListFieldColumn<TItem>(
  column: EntityListColumn<TItem>,
): column is EntityListFieldColumn<TItem> {
  return column.type !== 'action';
}
