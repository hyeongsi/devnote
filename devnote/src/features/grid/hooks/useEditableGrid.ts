import { useCallback, useEffect, useMemo, useState } from 'react';

import type {
  EditableGridColumn,
  EditableGridFieldColumn,
  EditableGridManagedRow,
  EditableGridProps,
} from '../types/editableGridTypes';
import { deriveGridRowState, getDirtyGridFields } from '../utils/rowState';
import {
  buildEditableGridChangeSet,
  createEditableGridRow,
  createEditableGridRowId,
} from '../utils/editableGridUtils';

interface UseEditableGridOptions<TItem extends { id?: number; order: number }> {
  columns: EditableGridColumn<TItem>[];
  createEmptyItem: EditableGridProps<TItem>['createEmptyItem'];
  fetchItems: EditableGridProps<TItem>['fetchItems'];
  saveItems: EditableGridProps<TItem>['saveItems'];
  validateRow?: EditableGridProps<TItem>['validateRow'];
  onSaved: () => void;
}

export function useEditableGrid<TItem extends { id?: number; order: number }>({
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  validateRow,
  onSaved,
}: UseEditableGridOptions<TItem>) {
  const [rows, setRows] = useState<EditableGridManagedRow<TItem>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const rowFields = useMemo(
    () => columns.filter((column): column is EditableGridFieldColumn<TItem> => column.type !== 'action'),
    [columns],
  );

  const changeSet = useMemo(() => buildEditableGridChangeSet(rows), [rows]);
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

  const loadGrid = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextRows = (await fetchItems()).map((item) => createEditableGridRow(item));
      setRows(nextRows);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'A problem occurred while loading rows.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadGrid();
    });
  }, [loadGrid]);

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
            state: deriveGridRowState(row.original, nextCurrent, row.state),
            dirtyFields: getDirtyGridFields(row.original, nextCurrent),
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
    setRows((current) => [
      ...current,
      {
        clientId: createEditableGridRowId(),
        original: undefined,
        current: createEmptyItem(current.length + 1),
        state: 'added',
        dirtyFields: [],
        errors: {},
      },
    ]);
  }, [createEmptyItem]);

  const removeAddedRow = useCallback((clientId: string) => {
    setRows((current) => current.filter((row) => row.clientId !== clientId));
  }, []);

  const restoreRow = useCallback((clientId: string) => {
    setRows((current) =>
      current.map((row) =>
        row.clientId === clientId
          ? {
              ...row,
              state: deriveGridRowState(row.original, row.current, 'clean'),
              errors: {},
              dirtyFields: getDirtyGridFields(row.original, row.current),
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

  const saveGrid = useCallback(async () => {
    const validatedRows = validateAllRows();
    const invalidRow = validatedRows.find((row) => Object.keys(row.errors).length > 0);

    if (invalidRow) {
      setRows(validatedRows);
      return false;
    }

    setRows(validatedRows);
    setIsSaving(true);

    try {
      const changes = buildEditableGridChangeSet(validatedRows);
      const activeItems = validatedRows
        .filter((row) => row.state !== 'deleted')
        .map((row, index) => ({
          ...row.current,
          order: index + 1,
        }));

      await saveItems(activeItems, changes);
      await loadGrid();
      onSaved();
      return true;
    } finally {
      setIsSaving(false);
    }
  }, [loadGrid, onSaved, saveItems, validateAllRows]);

  return {
    rows,
    isLoading,
    isSaving,
    loadError,
    changeSet,
    hasChanges,
    addRow,
    removeAddedRow,
    restoreRow,
    markRowDeleted,
    saveGrid,
    updateField,
  };
}
