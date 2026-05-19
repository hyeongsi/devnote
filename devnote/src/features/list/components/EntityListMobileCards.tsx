import { Pencil, RotateCcw, Trash2, X } from 'lucide-react';

import type {
  EntityListFieldColumn,
  EntityListManagedRow,
} from '../types/entityListTypes';
import { entityListStatePresentation } from '../utils/entityListPresentation';
import { EntityListField } from './EntityListField';
import { EntityListStatusBadge } from './EntityListStatusBadge';

interface EntityListMobileCardsProps<TItem extends { id?: number; order: number }> {
  rows: EntityListManagedRow<TItem>[];
  fieldColumns: EntityListFieldColumn<TItem>[];
  editingRowIds: string[];
  emptyMessage: string;
  onToggleEditing: (clientId: string) => void;
  onToggleDelete: (row: EntityListManagedRow<TItem>) => void;
  updateField: <TKey extends Extract<keyof TItem, string>>(
    clientId: string,
    field: TKey,
    value: TItem[TKey],
  ) => void;
}

export function EntityListMobileCards<TItem extends { id?: number; order: number }>({
  rows,
  fieldColumns,
  editingRowIds,
  emptyMessage,
  onToggleEditing,
  onToggleDelete,
  updateField,
}: EntityListMobileCardsProps<TItem>) {
  return (
    <div className="divide-y divide-line md:hidden">
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-medium text-muted">{emptyMessage}</div>
      ) : (
        rows.map((row) => {
          const isEditing = editingRowIds.includes(row.clientId);

          return (
            <article
              key={row.clientId}
              className={`p-5 ${entityListStatePresentation[row.state].rowClassName}`}
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <EntityListStatusBadge state={row.state} />
                <div className="flex items-center gap-2">
                  {row.state !== 'deleted' ? (
                    <button
                      type="button"
                      aria-label={isEditing ? 'Finish editing' : 'Edit row'}
                      className="rounded-lg border border-line bg-white p-2 text-gray-500"
                      onClick={() => onToggleEditing(row.clientId)}
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={row.state === 'deleted' ? 'Restore row' : 'Delete row'}
                    className="rounded-lg border border-line bg-white p-2 text-gray-500"
                    onClick={() => onToggleDelete(row)}
                  >
                    {row.state === 'deleted' ? (
                      <RotateCcw className="h-4 w-4" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <dl className="space-y-4">
                {fieldColumns.map((column) => (
                  <div key={column.id} className="grid gap-1">
                    <dt className="text-xs font-bold uppercase tracking-wide text-gray-400">
                      {column.mobileLabel ?? column.title}
                    </dt>
                    <dd className="text-sm font-medium text-gray-700">
                      <EntityListField
                        row={row}
                        column={column}
                        isEditing={isEditing}
                        updateField={updateField}
                      />
                      {row.errors[column.field] ? (
                        <p className="mt-1 text-xs font-semibold text-red-500">{row.errors[column.field]}</p>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          );
        })
      )}
    </div>
  );
}
