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

interface UseEntityListOptions<TItem extends { id?: number; order: number }> {
  columns: EntityListColumn<TItem>[];
  createEmptyItem: EntityListProps<TItem>['createEmptyItem'];
  fetchItems: EntityListProps<TItem>['fetchItems'];
  saveItems: EntityListProps<TItem>['saveItems'];
  validateRow?: EntityListProps<TItem>['validateRow'];
  onSaved: () => void;
}

export function useEntityList<TItem extends { id?: number; order: number }>({
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  validateRow,
  onSaved,
}: UseEntityListOptions<TItem>) {
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

  const addRow = useCallback(() => {
    const clientId = createEntityListRowId();

    setRows((current) => [
      ...current,
      {
        clientId,
        original: undefined,
        current: createEmptyItem(current.length + 1),
        state: 'added',
        dirtyFields: [],
        errors: {},
      },
    ]);
    setEditingRowIds((current) => [...current, clientId]);
  }, [createEmptyItem]);

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
    saveList,
    updateField,
  };
}
