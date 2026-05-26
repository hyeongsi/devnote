import type { EntityListManagedRow, EntityListProps, EntityRowState } from '../types/entityListTypes';

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

export function canMoveEntityTreeRow<TItem extends { id?: number; order: number }>(
  row: EntityListManagedRow<TItem>,
  rows: EntityListManagedRow<TItem>[],
  tree: TreeConfig<TItem>,
  direction: 'up' | 'down',
) {
  const siblingRows = getEntityTreeSiblingRows(row, rows, tree);
  const siblingIndex = siblingRows.findIndex((candidate) => candidate.clientId === row.clientId);

  if (siblingIndex < 0) {
    return false;
  }

  return direction === 'up' ? siblingIndex > 0 : siblingIndex < siblingRows.length - 1;
}

export function getEntityTreeSubtreeRows<TItem extends { id?: number; order: number }>(
  row: EntityListManagedRow<TItem>,
  rows: EntityListManagedRow<TItem>[],
  tree: TreeConfig<TItem>,
) {
  const rowId = tree.getRowId(row.current);

  if (rowId === null || rowId === undefined) {
    return [row];
  }

  return rows.filter((candidate) => {
    if (candidate.clientId === row.clientId) {
      return true;
    }

    return isEntityTreeDescendantOf(candidate, rowId, rows, tree);
  });
}

export function canDropEntityTreeBlock<TItem extends { id?: number; order: number }>(
  activeRow: EntityListManagedRow<TItem> | undefined,
  overRow: EntityListManagedRow<TItem> | undefined,
  tree: TreeConfig<TItem>,
) {
  if (!activeRow || !overRow || activeRow.clientId === overRow.clientId) {
    return false;
  }

  if (activeRow.state === 'deleted' || overRow.state === 'deleted') {
    return false;
  }

  return String(tree.getParentId(activeRow.current) ?? '') === String(tree.getParentId(overRow.current) ?? '');
}

export function getEntityTreeInsertIndex<TItem extends { id?: number; order: number }>(
  rows: EntityListManagedRow<TItem>[],
  item: TItem,
  tree: TreeConfig<TItem>,
) {
  const parentId = tree.getParentId(item);

  if (parentId === null || parentId === undefined) {
    return rows.length;
  }

  const parentIndex = rows.findIndex((row) => String(tree.getRowId(row.current)) === String(parentId));

  if (parentIndex < 0) {
    return rows.length;
  }

  const lastDescendantIndex = rows.reduce((lastIndex, row, index) => {
    if (index <= parentIndex) {
      return lastIndex;
    }

    return isEntityTreeDescendantOf(row, parentId, rows, tree) ? index : lastIndex;
  }, parentIndex);

  return lastDescendantIndex + 1;
}

export function moveEntityTreeBlock<TItem extends { id?: number; order: number }>(
  rows: EntityListManagedRow<TItem>[],
  activeClientId: string,
  overClientId: string,
  tree: TreeConfig<TItem>,
) {
  const activeRow = rows.find((row) => row.clientId === activeClientId);
  const overRow = rows.find((row) => row.clientId === overClientId);

  if (!canDropEntityTreeBlock(activeRow, overRow, tree) || !activeRow || !overRow) {
    return rows;
  }

  const siblingRows = getEntityTreeSiblingRows(activeRow, rows, tree);
  const activeSiblingIndex = siblingRows.findIndex((row) => row.clientId === activeClientId);
  const overSiblingIndex = siblingRows.findIndex((row) => row.clientId === overClientId);

  if (activeSiblingIndex < 0 || overSiblingIndex < 0) {
    return rows;
  }

  const reorderedSiblings = arrayMove(siblingRows, activeSiblingIndex, overSiblingIndex);
  const siblingBlocks = new Map(
    siblingRows.map((sibling) => [sibling.clientId, getEntityTreeSubtreeRows(sibling, rows, tree)]),
  );
  const affectedIds = new Set([...siblingBlocks.values()].flat().map((row) => row.clientId));
  const affectedIndexes = rows
    .map((row, index) => (affectedIds.has(row.clientId) ? index : -1))
    .filter((index) => index >= 0);
  const firstAffectedIndex = Math.min(...affectedIndexes);
  const lastAffectedIndex = Math.max(...affectedIndexes);
  const reorderedRows = reorderedSiblings.flatMap((sibling, index) => {
    const block = siblingBlocks.get(sibling.clientId) ?? [sibling];
    const root = withDerivedTreeRowState({
      ...block[0],
      current: {
        ...block[0].current,
        order: index + 1,
      },
    });

    return [root, ...block.slice(1)];
  });

  return [
    ...rows.slice(0, firstAffectedIndex),
    ...reorderedRows,
    ...rows.slice(lastAffectedIndex + 1),
  ];
}

export function moveEntityTreeRow<TItem extends { id?: number; order: number }>(
  rows: EntityListManagedRow<TItem>[],
  clientId: string,
  tree: TreeConfig<TItem>,
  direction: 'up' | 'down',
) {
  const target = rows.find((row) => row.clientId === clientId);

  if (!target || target.state === 'deleted') {
    return rows;
  }

  const siblingRows = getEntityTreeSiblingRows(target, rows, tree);
  const siblingIndex = siblingRows.findIndex((row) => row.clientId === clientId);
  const swapSiblingIndex = direction === 'up' ? siblingIndex - 1 : siblingIndex + 1;
  const swapTarget = siblingRows[swapSiblingIndex];

  if (siblingIndex < 0 || !swapTarget) {
    return rows;
  }

  const targetIndex = rows.findIndex((row) => row.clientId === target.clientId);
  const swapIndex = rows.findIndex((row) => row.clientId === swapTarget.clientId);

  if (targetIndex < 0 || swapIndex < 0) {
    return rows;
  }

  const nextRows = [...rows];
  nextRows[targetIndex] = withDerivedTreeRowState({
    ...swapTarget,
    current: {
      ...swapTarget.current,
      order: target.current.order,
    },
  });
  nextRows[swapIndex] = withDerivedTreeRowState({
    ...target,
    current: {
      ...target.current,
      order: swapTarget.current.order,
    },
  });

  return nextRows;
}

function isEntityTreeDescendantOf<TItem extends { id?: number; order: number }>(
  candidate: EntityListManagedRow<TItem>,
  ancestorId: number | string,
  rows: EntityListManagedRow<TItem>[],
  tree: TreeConfig<TItem>,
) {
  let parentId = tree.getParentId(candidate.current);

  while (parentId !== null && parentId !== undefined) {
    if (String(parentId) === String(ancestorId)) {
      return true;
    }

    const parent = rows.find((row) => String(tree.getRowId(row.current)) === String(parentId));

    if (!parent) {
      return false;
    }

    parentId = tree.getParentId(parent.current);
  }

  return false;
}

function arrayMove<TValue>(items: TValue[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);

  return nextItems;
}

function getEntityTreeSiblingRows<TItem extends { id?: number; order: number }>(
  row: EntityListManagedRow<TItem>,
  rows: EntityListManagedRow<TItem>[],
  tree: TreeConfig<TItem>,
) {
  const parentKey = String(tree.getParentId(row.current) ?? '');

  return rows.filter(
    (candidate) =>
      candidate.state !== 'deleted' &&
      String(tree.getParentId(candidate.current) ?? '') === parentKey,
  );
}

function withDerivedTreeRowState<TItem extends { id?: number; order: number }>(
  row: EntityListManagedRow<TItem>,
) {
  return {
    ...row,
    state: deriveMovedTreeRowState(row),
    dirtyFields: getMovedTreeRowDirtyFields(row.original, row.current),
  };
}

function deriveMovedTreeRowState<TItem extends { id?: number; order: number }>(
  row: EntityListManagedRow<TItem>,
): EntityRowState {
  if (row.state === 'added' || row.state === 'deleted') {
    return row.state;
  }

  if (!row.original) {
    return 'added';
  }

  return JSON.stringify(row.original) === JSON.stringify(row.current) ? 'clean' : 'modified';
}

function getMovedTreeRowDirtyFields<TItem extends object>(original: TItem | undefined, current: TItem) {
  if (!original) {
    return Object.keys(current);
  }

  return Object.keys(current).filter((field) => {
    const key = field as keyof TItem;
    return JSON.stringify(original[key]) !== JSON.stringify(current[key]);
  });
}
