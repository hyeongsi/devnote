import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, GripVertical, Pencil, RotateCcw, Trash2, X } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  EntityListFieldColumn,
  EntityListManagedRow,
  EntityListProps,
} from '../types/entityListTypes';
import { entityListStatePresentation } from '../utils/entityListPresentation';
import { hasEntityTreeChildren } from '../utils/entityListTree';
import { EntityListField } from './EntityListField';
import { EntityListStatusBadge } from './EntityListStatusBadge';

interface EntityListMobileCardsProps<TItem extends { id?: number; order: number }> {
  rows: EntityListManagedRow<TItem>[];
  allRows: EntityListManagedRow<TItem>[];
  fieldColumns: EntityListFieldColumn<TItem>[];
  editingRowIds: string[];
  emptyMessage: string;
  onToggleEditing: (clientId: string) => void;
  onToggleDelete: (row: EntityListManagedRow<TItem>) => void;
  renderRowActions?: (row: EntityListManagedRow<TItem>) => ReactNode;
  updateField: <TKey extends Extract<keyof TItem, string>>(
    clientId: string,
    field: TKey,
    value: TItem[TKey],
  ) => void;
  tree?: EntityListProps<TItem>['tree'];
  collapsedTreeRowIds?: Set<string>;
  onToggleTreeRow?: (row: TItem) => void;
  sortableIdPrefix?: string;
}

export function EntityListMobileCards<TItem extends { id?: number; order: number }>({
  rows,
  allRows,
  fieldColumns,
  editingRowIds,
  emptyMessage,
  onToggleEditing,
  onToggleDelete,
  renderRowActions,
  updateField,
  tree,
  collapsedTreeRowIds,
  onToggleTreeRow,
  sortableIdPrefix = '',
}: EntityListMobileCardsProps<TItem>) {
  return (
    <div className="divide-y divide-line md:hidden">
      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-medium text-muted">{emptyMessage}</div>
      ) : (
        rows.map((row) => {
          const isEditing = editingRowIds.includes(row.clientId);
          const treeRowId = tree?.getRowId(row.current);
          const treeRowKey = treeRowId === undefined || treeRowId === null ? null : String(treeRowId);
          const hasChildren = tree ? hasEntityTreeChildren(row.current, allRows, tree) : false;
          const collapsed = treeRowKey ? collapsedTreeRowIds?.has(treeRowKey) ?? false : false;

          return (
            <SortableMobileCard
              key={row.clientId}
              id={`${sortableIdPrefix}${row.clientId}`}
              disabled={!tree?.draggable || row.state === 'deleted'}
              className={`p-5 ${entityListStatePresentation[row.state].rowClassName}`}
            >
              {({ setActivatorNodeRef, dragAttributes, dragListeners }) => (
              <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <EntityListStatusBadge state={row.state} />
                <div className="flex items-center gap-2">
                  {renderRowActions?.(row)}
                  {tree?.draggable ? (
                    <button
                      type="button"
                      aria-label="드래그하여 이동"
                      className="rounded-lg border border-line bg-white p-2 text-gray-500"
                      ref={setActivatorNodeRef}
                      {...dragAttributes}
                      {...dragListeners}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  ) : null}
                  {row.state !== 'deleted' ? (
                    <button
                      type="button"
                      aria-label={isEditing ? '수정 완료' : '수정'}
                      className="rounded-lg border border-line bg-white p-2 text-gray-500"
                      onClick={() => onToggleEditing(row.clientId)}
                    >
                      {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    aria-label={row.state === 'deleted' ? '삭제 취소' : '삭제'}
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
                        rows={allRows}
                        column={column}
                        isEditing={isEditing}
                        updateField={updateField}
                      />
                      {tree && column.id === fieldColumns[0]?.id && hasChildren ? (
                        <button
                          type="button"
                          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary"
                          onClick={() => onToggleTreeRow?.(row.current)}
                        >
                          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                          {collapsed ? '하위 메뉴 보기' : '하위 메뉴 숨기기'}
                        </button>
                      ) : null}
                      {row.errors[column.field] ? (
                        <p className="mt-1 text-xs font-semibold text-red-500">{row.errors[column.field]}</p>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
              </>
              )}
            </SortableMobileCard>
          );
        })
      )}
    </div>
  );
}

interface SortableMobileCardProps {
  id: string;
  disabled: boolean;
  className: string;
  children: (helpers: {
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    dragAttributes: ReturnType<typeof useSortable>['attributes'];
    dragListeners: ReturnType<typeof useSortable>['listeners'];
  }) => ReactNode;
}

function SortableMobileCard({ id, disabled, className, children }: SortableMobileCardProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'relative z-10 opacity-70 shadow-lg' : ''}`}
    >
      {children({
        setActivatorNodeRef,
        dragAttributes: attributes,
        dragListeners: listeners,
      })}
    </article>
  );
}
