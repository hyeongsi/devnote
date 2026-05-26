import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  EntityListColumn,
  EntityListFieldColumn,
  EntityListManagedRow,
  EntityListProps,
} from '../types/entityListTypes';
import {
  buildEntityListChangeSet,
  createEntityListRow,
  createEntityListRowId,
  deriveEntityRowState,
  getDirtyEntityFields,
} from '../utils/entityListUtils';
import { getEntityTreeInsertIndex, moveEntityTreeBlock } from '../utils/entityListTree';

interface UseEntityListOptions<TItem extends { id?: number; order: number }, TAddContext> {
  columns: EntityListColumn<TItem>[];
  createEmptyItem: EntityListProps<TItem, TAddContext>['createEmptyItem'];
  fetchItems: EntityListProps<TItem, TAddContext>['fetchItems'];
  saveItems: EntityListProps<TItem, TAddContext>['saveItems'];
  validateRow?: EntityListProps<TItem, TAddContext>['validateRow'];
  onSaved: () => void;
  tree?: EntityListProps<TItem, TAddContext>['tree'];
}

export function useEntityList<TItem extends { id?: number; order: number }, TAddContext = void>({
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  validateRow,
  onSaved,
  tree,
}: UseEntityListOptions<TItem, TAddContext>) {
  const [rows, setRows] = useState<EntityListManagedRow<TItem>[]>([]);
  const [editingRowIds, setEditingRowIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const rowFields = useMemo(
    () => columns.filter((column): column is EntityListFieldColumn<TItem> => column.type !== 'action'),
    [columns],
  );

  const changeSet = useMemo(() => buildEntityListChangeSet(rows), [rows]);
  const hasChanges =
    changeSet.added.length > 0 || changeSet.modified.length > 0 || changeSet.deleted.length > 0;

  const runValidation = useCallback(
    (targetRow: TItem, allRows: TItem[]) => {
      const errors: Record<string, string> = {};

      rowFields.forEach((column) => {
        const value = targetRow[column.field];

        if (column.required) {
          const missing =
            value === null ||
            value === undefined ||
            (typeof value === 'string' && value.trim().length === 0);

          if (missing) {
            errors[column.field] = `${column.title} is required.`;
            return;
          }
        }

        const message = column.validate?.(value, targetRow, allRows);

        if (message) {
          errors[column.field] = message;
        }
      });

      return {
        ...errors,
        ...(validateRow?.(targetRow, allRows) ?? {}),
      };
    },
    [rowFields, validateRow],
  );

  const loadList = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextRows = (await fetchItems()).map((item) => createEntityListRow(item));
      setRows(nextRows);
      setEditingRowIds([]);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'A problem occurred while loading rows.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadList();
    });
  }, [loadList]);

  const updateField = useCallback(
    <TKey extends Extract<keyof TItem, string>>(clientId: string, field: TKey, value: TItem[TKey]) => {
      setRows((current) => {
        const nextRows = current.map((row) => {
          if (row.clientId !== clientId || row.state === 'deleted') {
            return row;
          }

          const nextCurrent = {
            ...row.current,
            [field]: value,
          } as TItem;

          return {
            ...row,
            current: nextCurrent,
            state: deriveEntityRowState(row.original, nextCurrent, row.state),
            dirtyFields: getDirtyEntityFields(row.original, nextCurrent),
          };
        });

        return nextRows.map((row) => {
          if (row.clientId !== clientId || row.state === 'deleted') {
            return row;
          }

          return {
            ...row,
            errors: runValidation(
              row.current,
              nextRows.filter((entry) => entry.state !== 'deleted').map((entry) => entry.current),
            ),
          };
        });
      });
    },
    [runValidation],
  );

  const addRow = useCallback((context?: TAddContext) => {
    const clientId = createEntityListRowId();

    setRows((current) => {
      const currentItem = createEmptyItem(current.length + 1, context, current);
      const nextRow = {
        clientId,
        original: undefined,
        current: currentItem,
        state: 'added',
        dirtyFields: [],
        errors: {},
      } satisfies EntityListManagedRow<TItem>;
      const insertIndex = tree ? getEntityTreeInsertIndex(current, currentItem, tree) : current.length;

      return [
        ...current.slice(0, insertIndex),
        nextRow,
        ...current.slice(insertIndex),
      ];
    });
    setEditingRowIds((current) => [...current, clientId]);
  }, [createEmptyItem, tree]);

  const toggleEditing = useCallback((clientId: string) => {
    setEditingRowIds((current) =>
      current.includes(clientId) ? current.filter((id) => id !== clientId) : [...current, clientId],
    );
  }, []);

  const removeAddedRow = useCallback((clientId: string) => {
    setRows((current) => current.filter((row) => row.clientId !== clientId));
    setEditingRowIds((current) => current.filter((id) => id !== clientId));
  }, []);

  const restoreRow = useCallback((clientId: string) => {
    setRows((current) =>
      current.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              state: deriveEntityRowState(row.original, row.current, 'clean'),
              errors: {},
              dirtyFields: getDirtyEntityFields(row.original, row.current),
            }
          : row,
      ),
    );
  }, []);

  const markRowDeleted = useCallback((clientId: string) => {
    setRows((current) =>
      current.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              state: 'deleted',
              errors: {},
            }
          : row,
      ),
    );
    setEditingRowIds((current) => current.filter((id) => id !== clientId));
  }, []);

  const moveRow = useCallback((activeClientId: string, overClientId: string) => {
    if (!tree) {
      return;
    }

    setRows((current) => moveEntityTreeBlock(current, activeClientId, overClientId, tree));
  }, [tree]);

  const updateRow = useCallback((clientId: string, updater: (row: TItem, rows: TItem[]) => TItem) => {
    setRows((current) => {
      const targetIndex = current.findIndex((row) => row.clientId === clientId);
      const target = current[targetIndex];

      if (!target || target.state === 'deleted') {
        return current;
      }

      const nextCurrent = updater(
        target.current,
        current.filter((row) => row.state !== 'deleted').map((row) => row.current),
      );
      const nextRow = {
        ...target,
        current: nextCurrent,
        state: deriveEntityRowState(target.original, nextCurrent, target.state),
        dirtyFields: getDirtyEntityFields(target.original, nextCurrent),
      };
      const rowsWithoutTarget = current.filter((row) => row.clientId !== clientId);
      const insertIndex = tree ? getEntityTreeInsertIndex(rowsWithoutTarget, nextCurrent, tree) : targetIndex;
      const nextRows = [
        ...rowsWithoutTarget.slice(0, insertIndex),
        nextRow,
        ...rowsWithoutTarget.slice(insertIndex),
      ];
      const activeRows = nextRows.filter((row) => row.state !== 'deleted').map((row) => row.current);

      return nextRows.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              errors: runValidation(row.current, activeRows),
            }
          : row,
      );
    });
  }, [runValidation, tree]);

  const validateAllRows = useCallback(() => {
    const activeRows = rows.filter((entry) => entry.state !== 'deleted').map((entry) => entry.current);

    return rows.map((row) => {
      if (row.state === 'deleted') {
        return {
          ...row,
          errors: {},
        };
      }

      return {
        ...row,
        errors: runValidation(row.current, activeRows),
      };
    });
  }, [rows, runValidation]);

  const saveList = useCallback(async () => {
    const validatedRows = validateAllRows();
    const invalidRow = validatedRows.find((row) => Object.keys(row.errors).length > 0);

    if (invalidRow) {
      setRows(validatedRows);
      return false;
    }

    setRows(validatedRows);
    setIsSaving(true);

    try {
      const changes = buildEntityListChangeSet(validatedRows);
      const activeItems = validatedRows
        .filter((row) => row.state !== 'deleted')
        .map((row, index) => ({
          ...row.current,
          order: index + 1,
        }));

      await saveItems(activeItems, changes);
      await loadList();
      onSaved();
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [loadList, onSaved, saveItems, validateAllRows]);

  return {
    rows,
    editingRowIds,
    isLoading,
    isSaving,
    loadError,
    changeSet,
    hasChanges,
    addRow,
    toggleEditing,
    removeAddedRow,
    restoreRow,
    markRowDeleted,
    moveRow,
    updateRow,
    saveList,
    updateField,
  };
}
