import type { EntityListManagedRow, EntityListProps } from '../types/entityListTypes';

type TreeConfig<TItem extends { id?: number; order: number }> = NonNullable<EntityListProps<TItem>['tree']>;

export function getVisibleEntityTreeRows<TItem extends { id?: number; order: number }>(
  rows: EntityListManagedRow<TItem>[],
  collapsedRowIds: Set<string>,
  tree: TreeConfig<TItem>,
) {
  return rows.filter((row) => {
    let parentId = tree.getParentId(row.current);

    while (parentId !== null && parentId !== undefined) {
      const parentKey = String(parentId);

      if (collapsedRowIds.has(parentKey)) {
        return false;
      }

      const parent = rows.find((candidate) => String(tree.getRowId(candidate.current)) === parentKey);

      if (!parent) {
        return true;
      }

      parentId = tree.getParentId(parent.current);
    }

    return true;
  });
}

export function hasEntityTreeChildren<TItem extends { id?: number; order: number }>(
  row: TItem,
  rows: EntityListManagedRow<TItem>[],
  tree: TreeConfig<TItem>,
) {
  const rowId = tree.getRowId(row);

  if (rowId === null || rowId === undefined) {
    return false;
  }

  return rows.some((candidate) => String(tree.getParentId(candidate.current)) === String(rowId));
}
