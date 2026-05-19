import { Check, Pencil, RotateCcw, Trash2 } from 'lucide-react';

import type {
  EntityListFieldColumn,
  EntityListManagedRow,
  EntityRowState,
} from '../types/entityListTypes';
import { entityListStatePresentation } from '../utils/entityListPresentation';
import { EntityListField } from './EntityListField';
import { EntityListStatusBadge } from './EntityListStatusBadge';

interface EntityListTableProps<TItem extends { id?: number; order: number }> {
  rows: EntityListManagedRow<TItem>[];
  fieldColumns: EntityListFieldColumn<TItem>[];
  editingRowIds: string[];
  emptyMessage: string;
  getRowClassName?: (row: TItem, state: EntityRowState) => string;
  onToggleEditing: (clientId: string) => void;
  onToggleDelete: (row: EntityListManagedRow<TItem>) => void;
  updateField: <TKey extends Extract<keyof TItem, string>>(
    clientId: string,
    field: TKey,
    value: TItem[TKey],
  ) => void;
}

export function EntityListTable<TItem extends { id?: number; order: number }>({
  rows,
  fieldColumns,
  editingRowIds,
  emptyMessage,
  getRowClassName,
  onToggleEditing,
  onToggleDelete,
  updateField,
}: EntityListTableProps<TItem>) {
  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
        <thead className="bg-[#fbfbff] text-xs font-bold uppercase tracking-wide text-gray-500">
          <tr>
            {fieldColumns.map((column) => (
              <th
                key={column.id}
                className={`border-b border-line px-5 py-3 ${column.headerClassName ?? ''} ${column.className ?? ''}`}
              >
                {column.title}
              </th>
            ))}
            <th className="w-28 border-b border-line px-5 py-3 text-right">Status</th>
            <th className="w-28 border-b border-line px-5 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={fieldColumns.length + 2}
                className="px-5 py-12 text-center text-sm font-medium text-muted"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const isEditing = editingRowIds.includes(row.clientId);

              return (
                <tr
                  key={row.clientId}
                  className={`transition-colors hover:bg-primary-soft/35 ${
                    entityListStatePresentation[row.state].rowClassName
                  } ${getRowClassName?.(row.current, row.state) ?? ''}`}
                >
                  {fieldColumns.map((column) => (
                    <td
                      key={column.id}
                      className={`border-b border-line px-5 py-4 align-middle ${
                        row.state === 'deleted' ? 'line-through decoration-red-300' : ''
                      } ${column.className ?? ''}`}
                    >
                      <div className="space-y-1">
                        <EntityListField
                          row={row}
                          column={column}
                          isEditing={isEditing}
                          updateField={updateField}
                        />
                        {row.errors[column.field] ? (
                          <p className="text-xs font-semibold text-red-500">{row.errors[column.field]}</p>
                        ) : null}
                      </div>
                    </td>
                  ))}
                  <td className="border-b border-line px-5 py-4 text-right align-middle">
                    <EntityListStatusBadge state={row.state} />
                  </td>
                  <td className="border-b border-line px-5 py-4 align-middle">
                    <div className="flex items-center justify-end gap-2">
                      {row.state !== 'deleted' ? (
                        <button
                          type="button"
                          aria-label={isEditing ? 'Finish editing' : 'Edit row'}
                          className="rounded-lg border border-transparent p-2 text-gray-500 transition hover:border-line hover:bg-white hover:text-primary"
                          onClick={() => onToggleEditing(row.clientId)}
                        >
                          {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        aria-label={row.state === 'deleted' ? 'Restore row' : 'Delete row'}
                        className={`rounded-lg border border-transparent p-2 transition ${
                          row.state === 'deleted'
                            ? 'text-red-600 hover:border-red-200 hover:bg-red-50'
                            : 'text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                        }`}
                        onClick={() => onToggleDelete(row)}
                      >
                        {row.state === 'deleted' ? (
                          <RotateCcw className="h-4 w-4" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
