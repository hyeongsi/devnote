import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type {
  CellClassParams,
  ColDef,
  ICellRendererParams,
  RowClassRules,
} from 'ag-grid-community';

import { AdminToggleSwitch } from '../../admin/AdminToggleSwitch';
import { useFeedback } from '../../feedback/FeedbackProvider';
import { useEditableGrid } from '../hooks/useEditableGrid';
import type {
  EditableGridCellContext,
  EditableGridFieldColumn,
  EditableGridManagedRow,
  EditableGridProps,
} from '../types/editableGridTypes';
import {
  coerceEditableGridValue,
  getEditableGridValueLabel,
  resolveEditableGridColumn,
} from '../utils/editableGridUtils';
import { BaseGrid } from './BaseGrid';

function isToggleColumn<TItem>(
  column: EditableGridFieldColumn<TItem>,
) {
  return column.type === 'switch' || column.type === 'checkbox';
}

export function EditableGrid<TItem extends { id?: number; order: number }>({
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
}: EditableGridProps<TItem>) {
  const { showConfirm, showMessage } = useFeedback();

  const handleSaved = useCallback(() => {
    showMessage({
      tone: 'success',
      title: `${itemLabel} changes were saved.`,
      description: `The latest ${itemLabel.toLowerCase()} list has been refreshed.`,
    });
  }, [itemLabel, showMessage]);

  const {
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
  } = useEditableGrid({
    columns,
    createEmptyItem,
    fetchItems,
    saveItems,
    validateRow,
    onSaved: handleSaved,
  });

  const toggleDelete = useCallback(
    async (row: EditableGridManagedRow<TItem>) => {
      if (row.state === 'added') {
        removeAddedRow(row.clientId);
        return;
      }

      if (row.state === 'deleted') {
        restoreRow(row.clientId);
        return;
      }

      const accepted = await showConfirm({
        title: `${getItemName(row.current)} will be marked for deletion.`,
        description: 'The row will not be removed from the server until you save the grid.',
        confirmLabel: 'Mark delete',
        cancelLabel: 'Keep row',
        tone: 'warning',
      });

      if (accepted) {
        markRowDeleted(row.clientId);
      }
    },
    [getItemName, markRowDeleted, removeAddedRow, restoreRow, showConfirm],
  );

  const handleSave = useCallback(async () => {
    try {
      const saved = await saveGrid();

      if (!saved) {
        showMessage({
          tone: 'warning',
          title: `Please resolve validation errors before saving ${itemLabel.toLowerCase()} changes.`,
        });
      }
    } catch (error) {
      showMessage({
        tone: 'error',
        title: `Failed to save ${itemLabel.toLowerCase()} changes.`,
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    }
  }, [itemLabel, saveGrid, showMessage]);

  const rowClassRules = useMemo<RowClassRules<EditableGridManagedRow<TItem>>>(
    () => ({
      'grid-row-added': (params) => params.data?.state === 'added',
      'grid-row-modified': (params) => params.data?.state === 'modified',
      'grid-row-deleted': (params) => params.data?.state === 'deleted',
    }),
    [],
  );

  const columnDefs = useMemo<ColDef<EditableGridManagedRow<TItem>>[]>(() => {
    const mappedColumns = columns.map<ColDef<EditableGridManagedRow<TItem>>>((column) => {
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
          cellRenderer: (params: ICellRendererParams<EditableGridManagedRow<TItem>>) => {
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
        minWidth: column.id === 'description' ? 260 : isToggleColumn(column) ? 120 : 140,
        maxWidth: isToggleColumn(column) ? 130 : undefined,
        editable: (params) =>
          params.data != null &&
          params.data.state !== 'deleted' &&
          resolveEditableGridColumn(column, params.data.current) &&
          !isToggleColumn(column),
        valueGetter: (params) => params.data?.current[column.field],
        valueSetter: (params) => {
          if (!params.data) {
            return false;
          }

          updateField(
            params.data.clientId,
            column.field,
            coerceEditableGridValue(column, params.newValue),
          );
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
        cellClass: (params: CellClassParams<EditableGridManagedRow<TItem>>) => {
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
            resolveEditableGridColumn(column, row.current) &&
            row.state !== 'deleted' &&
            !isToggleColumn(column)
          ) {
            classes.push('grid-cell-editable cursor-text');
          }

          return classes.join(' ');
        },
        tooltipValueGetter: (params) => params.data?.errors[column.field] ?? '',
        cellRenderer: (params: ICellRendererParams<EditableGridManagedRow<TItem>>) => {
          if (!params.data) {
            return null;
          }

          const row = params.data;
          const value = row.current[column.field];
          const disabled = row.state === 'deleted';
          const context: EditableGridCellContext<TItem, TItem[typeof column.field]> = {
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
            return <div className="grid-cell-content">{column.render(context)}</div>;
          }

          return <span className="grid-cell-content">{getEditableGridValueLabel(column, value)}</span>;
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
      cellRenderer: (params: ICellRendererParams<EditableGridManagedRow<TItem>>) => {
        if (!params.data) {
          return null;
        }

        return (
          <div className="flex w-full items-center justify-center">
            <button
              type="button"
              aria-label={params.data.state === 'deleted' ? 'Restore row' : 'Delete row'}
              className={`grid-action-button ${
                params.data.state === 'deleted'
                  ? 'text-red-600 hover:border-red-200 hover:bg-red-50'
                  : 'text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
              }`}
              onClick={() => void toggleDelete(params.data!)}
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
    <section className="rounded-[24px] border border-line bg-white p-5 shadow-[0_18px_50px_rgba(17,24,39,0.045)] md:p-6">
      <div className="flex flex-col gap-4 border-b border-line/70 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-gray-950">{title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition ${
              hasChanges && !isSaving
                ? 'bg-primary shadow-[0_10px_24px_rgba(109,93,252,0.18)] hover:brightness-105'
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
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-bold text-gray-700 transition hover:border-primary/30 hover:bg-primary-soft hover:text-primary"
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

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
        <span className="grid-status-chip">Rows {rows.length}</span>
        <span className="grid-status-chip grid-status-chip-added">Added {changeSet.added.length}</span>
        <span className="grid-status-chip grid-status-chip-modified">Modified {changeSet.modified.length}</span>
        <span className="grid-status-chip grid-status-chip-deleted">Deleted {changeSet.deleted.length}</span>
        <span className={`ml-auto ${hasChanges ? 'text-primary' : 'text-gray-400'}`}>
          {hasChanges ? 'Unsaved changes' : 'Up to date'}
        </span>
      </div>
    </section>
  );
}
