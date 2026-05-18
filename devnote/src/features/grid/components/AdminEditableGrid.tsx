import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type {
  CellClassParams,
  ColDef,
  ICellRendererParams,
  RowClassRules,
} from 'ag-grid-community';

import { useFeedback } from '../../feedback/FeedbackProvider';
import { AdminToggleSwitch } from '../../admin/AdminToggleSwitch';
import { BaseGrid } from './BaseGrid';
import {
  createManagedGridRow,
  deriveGridRowState,
  getDirtyGridFields,
} from '../utils/rowState';

export type GridRowState = 'clean' | 'added' | 'modified' | 'deleted';
export type GridColumnType = 'text' | 'number' | 'select' | 'checkbox' | 'switch' | 'action';

export interface GridSelectOption {
  label: string;
  value: string | number;
}

export interface GridChangeSet<TItem> {
  added: TItem[];
  modified: Array<{
    original: TItem;
    current: TItem;
  }>;
  deleted: TItem[];
}

interface ManagedGridRow<TItem> {
  clientId: string;
  original?: TItem;
  current: TItem;
  state: GridRowState;
  dirtyFields: string[];
  errors: Record<string, string>;
}

interface GridCellContext<TItem, TValue> {
  row: TItem;
  value: TValue;
  rowState: GridRowState;
  isEditing: boolean;
  disabled: boolean;
  error?: string;
  update: (value: TValue) => void;
  commit: () => void;
}

interface GridRowActionContext<TItem> {
  row: TItem;
  rowState: GridRowState;
  isEditing: boolean;
  disabled: boolean;
}

interface GridBaseColumn {
  id: string;
  title: string;
  className?: string;
  headerClassName?: string;
}

export interface GridFieldColumn<
  TItem,
  TField extends Extract<keyof TItem, string> = Extract<keyof TItem, string>,
> extends GridBaseColumn {
  type: Exclude<GridColumnType, 'action'>;
  field: TField;
  placeholder?: string;
  options?: GridSelectOption[];
  editable?: boolean | ((row: TItem) => boolean);
  required?: boolean;
  render?: (context: GridCellContext<TItem, TItem[TField]>) => ReactNode;
  editor?: (context: GridCellContext<TItem, TItem[TField]>) => ReactNode;
  validate?: (value: TItem[TField], row: TItem, rows: TItem[]) => string | null;
}

export interface GridActionColumn<TItem> extends GridBaseColumn {
  type: 'action';
  render: (context: GridRowActionContext<TItem>) => ReactNode;
}

export type AdminEditableGridColumn<TItem> = GridFieldColumn<TItem> | GridActionColumn<TItem>;

export interface AdminEditableGridProps<TItem extends { id?: number; order: number }> {
  title: string;
  description: string;
  itemLabel: string;
  columns: AdminEditableGridColumn<TItem>[];
  createEmptyItem: (nextOrder: number) => TItem;
  fetchItems: () => Promise<TItem[]>;
  saveItems: (items: TItem[], changes: GridChangeSet<TItem>) => Promise<void>;
  getItemName: (item: TItem) => string;
  validateRow?: (row: TItem, rows: TItem[]) => Record<string, string>;
  getRowClassName?: (row: TItem, state: GridRowState) => string;
}

function createClientId() {
  return `grid-row-${crypto.randomUUID()}`;
}

function buildManagedRow<TItem>(item: TItem): ManagedGridRow<TItem> {
  const base = createManagedGridRow(item);
  return {
    ...base,
    clientId: createClientId(),
  };
}

function buildChangeSet<TItem>(rows: ManagedGridRow<TItem>[]): GridChangeSet<TItem> {
  return rows.reduce<GridChangeSet<TItem>>(
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

function resolveEditable<TItem>(column: GridFieldColumn<TItem>, row: TItem) {
  if (typeof column.editable === 'function') {
    return column.editable(row);
  }

  return column.editable ?? true;
}

function getValueLabel<TItem, TField extends Extract<keyof TItem, string>>(
  column: GridFieldColumn<TItem, TField>,
  value: TItem[TField],
) {
  if (column.type === 'select') {
    const matched = column.options?.find((option) => option.value === value);
    return matched?.label ?? String(value ?? '');
  }

  if (column.type === 'checkbox') {
    return value === true ? 'Checked' : 'Unchecked';
  }

  return String(value ?? '');
}

function coerceValue<TItem, TField extends Extract<keyof TItem, string>>(
  column: GridFieldColumn<TItem, TField>,
  value: unknown,
) {
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

export function AdminEditableGrid<TItem extends { id?: number; order: number }>({
  title,
  description,
  itemLabel,
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  getItemName,
  validateRow,
  getRowClassName,
}: AdminEditableGridProps<TItem>) {
  const { showConfirm, showMessage } = useFeedback();
  const [rows, setRows] = useState<ManagedGridRow<TItem>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const rowFields = useMemo(
    () => columns.filter((column): column is GridFieldColumn<TItem> => column.type !== 'action'),
    [columns],
  );

  const changeSet = useMemo(() => buildChangeSet(rows), [rows]);
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

  const loadGrid = useCallback(
    async (options?: { keepMessage?: boolean }) => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const nextRows = (await fetchItems()).map((item) => buildManagedRow(item));
        setRows(nextRows);

        if (options?.keepMessage) {
          showMessage({
            tone: 'success',
            title: `${itemLabel} changes were saved.`,
            description: `The latest ${itemLabel.toLowerCase()} list has been refreshed.`,
          });
        }
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : `A problem occurred while loading the ${itemLabel.toLowerCase()} list.`,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [fetchItems, itemLabel, showMessage],
  );

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

  function addRow() {
    setRows((current) => [
      ...current,
      {
        clientId: createClientId(),
        original: undefined,
        current: createEmptyItem(current.length + 1),
        state: 'added',
        dirtyFields: [],
        errors: {},
      },
    ]);
  }

  const toggleDelete = useCallback(
    async (clientId: string) => {
      const target = rows.find((row) => row.clientId === clientId);

      if (!target) {
        return;
      }

      if (target.state === 'added') {
        setRows((current) => current.filter((row) => row.clientId !== clientId));
        return;
      }

      if (target.state === 'deleted') {
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
        return;
      }

      const accepted = await showConfirm({
        title: `${getItemName(target.current)} will be marked for deletion.`,
        description: 'The row will not be removed from the server until you save the grid.',
        confirmLabel: 'Mark delete',
        cancelLabel: 'Keep row',
        tone: 'warning',
      });

      if (!accepted) {
        return;
      }

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
    },
    [getItemName, rows, showConfirm],
  );

  async function handleSave() {
    const validatedRows = rows.map((row) => {
      if (row.state === 'deleted') {
        return {
          ...row,
          errors: {},
        };
      }

      return {
        ...row,
        errors: runValidation(
          row.current,
          rows.filter((entry) => entry.state !== 'deleted').map((entry) => entry.current),
        ),
      };
    });

    const invalidRow = validatedRows.find((row) => Object.keys(row.errors).length > 0);

    if (invalidRow) {
      setRows(validatedRows);
      showMessage({
        tone: 'warning',
        title: `Please resolve validation errors before saving ${itemLabel.toLowerCase()} changes.`,
      });
      return;
    }

    setRows(validatedRows);
    setIsSaving(true);

    try {
      const changes = buildChangeSet(validatedRows);
      const activeItems = validatedRows
        .filter((row) => row.state !== 'deleted')
        .map((row, index) => ({
          ...row.current,
          order: index + 1,
        }));

      await saveItems(activeItems, changes);
      await loadGrid({ keepMessage: true });
    } catch (error) {
      showMessage({
        tone: 'error',
        title: `Failed to save ${itemLabel.toLowerCase()} changes.`,
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  const rowClassRules = useMemo<RowClassRules<ManagedGridRow<TItem>>>(
    () => ({
      'grid-row-added': (params) => params.data?.state === 'added',
      'grid-row-modified': (params) => params.data?.state === 'modified',
      'grid-row-deleted': (params) => params.data?.state === 'deleted',
    }),
    [],
  );

  const columnDefs = useMemo<ColDef<ManagedGridRow<TItem>>[]>(() => {
    const mappedColumns = columns.map<ColDef<ManagedGridRow<TItem>>>((column) => {
      if (column.type === 'action') {
        return {
          colId: column.id,
          headerName: column.title,
          editable: false,
          sortable: false,
          filter: false,
          width: 120,
          minWidth: 120,
          maxWidth: 120,
          pinned: 'right',
          cellRenderer: (params: ICellRendererParams<ManagedGridRow<TItem>>) => {
            if (!params.data) {
              return null;
            }

            return column.render({
              row: params.data.current,
              rowState: params.data.state,
              isEditing: false,
              disabled: params.data.state === 'deleted',
            });
          },
        };
      }

      return {
        colId: column.id,
        headerName: column.title,
        minWidth:
          column.id === 'description' ? 260 : column.type === 'switch' || column.type === 'checkbox' ? 120 : 140,
        maxWidth: column.type === 'switch' || column.type === 'checkbox' ? 130 : undefined,
        editable: (params) =>
          params.data != null &&
          params.data.state !== 'deleted' &&
          resolveEditable(column, params.data.current) &&
          column.type !== 'switch' &&
          column.type !== 'checkbox',
        valueGetter: (params) => params.data?.current[column.field],
        valueSetter: (params) => {
          if (!params.data) {
            return false;
          }

          updateField(params.data.clientId, column.field, coerceValue(column, params.newValue));
          return false;
        },
        cellEditor:
          column.type === 'select'
            ? 'agSelectCellEditor'
            : column.type === 'number'
              ? 'agNumberCellEditor'
              : 'agTextCellEditor',
        cellEditorParams:
          column.type === 'select'
            ? {
                values: column.options?.map((option) => option.value) ?? [],
              }
            : undefined,
        cellClass: (params: CellClassParams<ManagedGridRow<TItem>>) => {
          const row = params.data;
          const classes = [];

          if (row?.errors[column.field]) {
            classes.push('grid-cell-error');
          }

          if (column.type === 'number') {
            classes.push('justify-end');
          }

          if (
            row &&
            resolveEditable(column, row.current) &&
            row.state !== 'deleted' &&
            column.type !== 'switch' &&
            column.type !== 'checkbox'
          ) {
            classes.push('cursor-text');
          }

          return classes.join(' ');
        },
        tooltipValueGetter: (params) => params.data?.errors[column.field] ?? '',
        cellRenderer: (params: ICellRendererParams<ManagedGridRow<TItem>>) => {
          if (!params.data) {
            return null;
          }

          const row = params.data;
          const value = row.current[column.field];
          const disabled = row.state === 'deleted';
          const context: GridCellContext<TItem, TItem[typeof column.field]> = {
            row: row.current,
            value,
            rowState: row.state,
            isEditing: false,
            disabled,
            error: row.errors[column.field],
            update: (nextValue) => updateField(row.clientId, column.field, nextValue),
            commit: () => undefined,
          };

          if (column.type === 'switch') {
            return (
              <div className="flex w-full justify-center">
                <AdminToggleSwitch
                  active={Boolean(value)}
                  disabled={disabled}
                  onClick={() => context.update((!value) as TItem[typeof column.field])}
                />
              </div>
            );
          }

          if (column.type === 'checkbox') {
            return (
              <div className="flex w-full justify-center">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  disabled={disabled}
                  className="h-4 w-4 accent-primary"
                  onChange={(event) =>
                    context.update(event.target.checked as TItem[typeof column.field])
                  }
                />
              </div>
            );
          }

          if (column.render) {
            return column.render(context);
          }

          return getValueLabel(column, value);
        },
      };
    });

    mappedColumns.push({
      colId: '__actions__',
      headerName: 'Actions',
      editable: false,
      sortable: false,
      filter: false,
      width: 110,
      minWidth: 110,
      maxWidth: 110,
      pinned: 'right',
      cellRenderer: (params: ICellRendererParams<ManagedGridRow<TItem>>) => {
        if (!params.data) {
          return null;
        }

        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label={params.data.state === 'deleted' ? 'Restore row' : 'Delete row'}
              className={`rounded-full p-2 transition ${
                params.data.state === 'deleted'
                  ? 'text-red-600 hover:bg-red-100'
                  : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
              }`}
              onClick={() => void toggleDelete(params.data!.clientId)}
            >
              {params.data.state === 'deleted' ? (
                <RotateCcw className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        );
      },
    });

    return mappedColumns;
  }, [columns, toggleDelete, updateField]);

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
        Loading {itemLabel.toLowerCase()} list...
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-medium text-red-600 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
        {loadError}
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)] md:p-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-950">{title}</h2>
          <p className="mt-2 text-sm text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white transition ${
              hasChanges && !isSaving
                ? 'bg-primary shadow-[0_12px_30px_rgba(109,93,252,0.2)] hover:brightness-105'
                : 'cursor-not-allowed bg-gray-300 shadow-none'
            }`}
            onClick={() => void handleSave()}
            disabled={!hasChanges || isSaving}
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save changes'}
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(109,93,252,0.26)]"
            onClick={addRow}
          >
            <Plus className="h-4 w-4" />
            Add {itemLabel.toLowerCase()}
          </button>
        </div>
      </div>

      <BaseGrid
        className="mt-6"
        columnDefs={columnDefs}
        rowData={rows}
        gridHeight={Math.max(360, 82 + rows.length * 58)}
        getRowClass={(params) =>
          params.data ? getRowClassName?.(params.data.current, params.data.state) : undefined
        }
        getRowId={(params) => params.data.clientId}
        rowClassRules={rowClassRules}
        defaultColDef={{
          sortable: false,
        }}
      />

      <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-primary-soft px-4 py-3 text-sm font-medium text-muted md:flex-row md:items-center md:justify-between">
        <span>Row colors indicate unsaved state: blue for added, green for modified, red for deleted.</span>
        <span className={hasChanges ? 'text-primary' : ''}>
          {hasChanges
            ? `${changeSet.added.length} added, ${changeSet.modified.length} modified, ${changeSet.deleted.length} deleted`
            : 'No pending changes'}
        </span>
      </div>
    </section>
  );
}
