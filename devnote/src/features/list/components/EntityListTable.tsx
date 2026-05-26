import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ChevronDown, ChevronRight, GripVertical, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import type {
  EntityListFieldColumn,
  EntityListManagedRow,
  EntityRowState,
  EntityListProps,
} from '../types/entityListTypes';
import { entityListStatePresentation } from '../utils/entityListPresentation';
import { hasEntityTreeChildren } from '../utils/entityListTree';
import { EntityListField } from './EntityListField';
import { EntityListStatusBadge } from './EntityListStatusBadge';

interface EntityListTableProps<TItem extends { id?: number; order: number }> {
  rows: EntityListManagedRow<TItem>[];
  allRows: EntityListManagedRow<TItem>[];
  fieldColumns: EntityListFieldColumn<TItem>[];
  editingRowIds: string[];
  emptyMessage: string;
  getRowClassName?: (row: TItem, state: EntityRowState) => string;
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

export function EntityListTable<TItem extends { id?: number; order: number }>({
  rows,
  allRows,
  fieldColumns,
  editingRowIds,
  emptyMessage,
  getRowClassName,
  onToggleEditing,
  onToggleDelete,
  renderRowActions,
  updateField,
  tree,
  collapsedTreeRowIds,
  onToggleTreeRow,
  sortableIdPrefix = '',
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
            <th className="w-28 border-b border-line px-5 py-3 text-right">상태</th>
            <th className="w-28 border-b border-line px-5 py-3 text-right">작업</th>
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
              const treeRowId = tree?.getRowId(row.current);
              const treeRowKey = treeRowId === undefined || treeRowId === null ? null : String(treeRowId);
              const hasChildren = tree ? hasEntityTreeChildren(row.current, allRows, tree) : false;
              const collapsed = treeRowKey ? collapsedTreeRowIds?.has(treeRowKey) ?? false : false;

              return (
                <SortableTableRow
                  key={row.clientId}
                  id={`${sortableIdPrefix}${row.clientId}`}
                  disabled={!tree?.draggable || row.state === 'deleted'}
                  className={`transition-colors hover:bg-primary-soft/35 ${
                    entityListStatePresentation[row.state].rowClassName
                  } ${getRowClassName?.(row.current, row.state) ?? ''}`}
                >
                  {({ setActivatorNodeRef, dragAttributes, dragListeners }) => (
                    <>
                      {fieldColumns.map((column) => (
                        <td
                          key={column.id}
                          className={`border-b border-line px-5 py-4 align-middle ${
                            row.state === 'deleted' ? 'line-through decoration-red-300' : ''
                          } ${column.className ?? ''}`}
                        >
                          <div className="space-y-1">
                            {tree && column.id === fieldColumns[0]?.id ? (
                              <div
                                style={{ paddingLeft: `${(tree.getDepth?.(row.current) ?? 0) * 18}px` }}
                              >
                                <div className="inline-flex items-center gap-2 text-left">
                                  {tree.draggable ? (
                                    <button
                                      type="button"
                                      aria-label="드래그하여 이동"
                                      className="grid h-7 w-5 cursor-grab place-items-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 active:cursor-grabbing"
                                      ref={setActivatorNodeRef}
                                      {...dragAttributes}
                                      {...dragListeners}
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    className={`inline-flex items-center gap-2 text-left ${
                                      hasChildren ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                    onClick={() => {
                                      if (hasChildren) {
                                        onToggleTreeRow?.(row.current);
                                      }
                                    }}
                                  >
                                    <span className="grid h-5 w-5 place-items-center text-gray-400">
                                      {hasChildren ? (
                                        collapsed ? (
                                          <ChevronRight className="h-4 w-4" />
                                        ) : (
                                          <ChevronDown className="h-4 w-4" />
                                        )
                                      ) : null}
                                    </span>
                                    <EntityListField
                                      row={row}
                                      rows={allRows}
                                      column={column}
                                      isEditing={isEditing}
                                      updateField={updateField}
                                    />
                                  </button>
                                </div>
                              </div>
                            ) : (
                            <EntityListField
                              row={row}
                              rows={allRows}
                              column={column}
                              isEditing={isEditing}
                              updateField={updateField}
                            />
                            )}
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
                          {renderRowActions?.(row)}
                          {row.state !== 'deleted' ? (
                            <button
                              type="button"
                              aria-label={isEditing ? '수정 완료' : '수정'}
                              className="rounded-lg border border-transparent p-2 text-gray-500 transition hover:border-line hover:bg-white hover:text-primary"
                              onClick={() => onToggleEditing(row.clientId)}
                            >
                              {isEditing ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            aria-label={row.state === 'deleted' ? '삭제 취소' : '삭제'}
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
                    </>
                  )}
                </SortableTableRow>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

interface SortableTableRowProps {
  id: string;
  disabled: boolean;
  className: string;
  children: (helpers: {
    setActivatorNodeRef: (element: HTMLElement | null) => void;
    dragAttributes: ReturnType<typeof useSortable>['attributes'];
    dragListeners: ReturnType<typeof useSortable>['listeners'];
  }) => ReactNode;
}

function SortableTableRow({ id, disabled, className, children }: SortableTableRowProps) {
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
    <tr
      ref={setNodeRef}
      style={style}
      className={`${className} ${isDragging ? 'relative z-10 opacity-70 shadow-lg' : ''}`}
    >
      {children({
        setActivatorNodeRef,
        dragAttributes: attributes,
        dragListeners: listeners,
      })}
    </tr>
  );
}
