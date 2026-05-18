import { Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFeedback } from '../feedback/FeedbackProvider';
import { AdminToggleSwitch } from './AdminToggleSwitch';

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

interface ActiveGridCell {
  clientId: string;
  columnId: string;
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

function cloneItem<TItem>(item: TItem): TItem {
  return { ...item };
}

function sanitizeComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeComparable(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
        accumulator[key] = sanitizeComparable(entry);
        return accumulator;
      }, {});
  }

  return typeof value === 'string' ? value.trim() : value;
}

function isSameValue(left: unknown, right: unknown) {
  return JSON.stringify(sanitizeComparable(left)) === JSON.stringify(sanitizeComparable(right));
}

function areItemsEqual<TItem>(left: TItem, right: TItem) {
  return isSameValue(left, right);
}

function getDirtyFields<TItem extends object>(original: TItem | undefined, current: TItem) {
  if (!original) {
    return Object.keys(current as Record<string, unknown>);
  }

  const keys = new Set([
    ...Object.keys(original as Record<string, unknown>),
    ...Object.keys(current as Record<string, unknown>),
  ]);

  return Array.from(keys).filter((key) => {
    const originalValue = (original as Record<string, unknown>)[key];
    const currentValue = (current as Record<string, unknown>)[key];
    return !isSameValue(originalValue, currentValue);
  });
}

function deriveRowState<TItem extends object>(
  original: TItem | undefined,
  current: TItem,
  previousState: GridRowState,
) {
  if (previousState === 'deleted') {
    return 'deleted';
  }

  if (!original) {
    return 'added';
  }

  return areItemsEqual(original, current) ? 'clean' : 'modified';
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

function toManagedRow<TItem>(item: TItem): ManagedGridRow<TItem> {
  return {
    clientId: createClientId(),
    original: cloneItem(item),
    current: cloneItem(item),
    state: 'clean',
    dirtyFields: [],
    errors: {},
  };
}

function getRowStateClassName(state: GridRowState) {
  if (state === 'deleted') {
    return 'bg-red-50';
  }

  if (state === 'modified') {
    return 'bg-emerald-50';
  }

  if (state === 'added') {
    return 'bg-sky-50';
  }

  return 'even:bg-[#fdfdff]';
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
  const [activeCell, setActiveCell] = useState<ActiveGridCell | null>(null);

  const rowFields = useMemo(
    () => columns.filter((column): column is GridFieldColumn<TItem> => column.type !== 'action'),
    [columns],
  );

  const changeSet = useMemo(() => buildChangeSet(rows), [rows]);

  const hasChanges =
    changeSet.added.length > 0 || changeSet.modified.length > 0 || changeSet.deleted.length > 0;

  function runValidation(targetRow: TItem, allRows: TItem[]) {
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
  }

  async function loadGrid(options?: { keepMessage?: boolean }) {
    setIsLoading(true);
    setLoadError(null);

    try {
      const nextRows = (await fetchItems()).map((item) => toManagedRow(item));
      setRows(nextRows);
      setActiveCell(null);

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
  }

  useEffect(() => {
    void loadGrid();
  }, []);

  function replaceRow(clientId: string, updater: (current: ManagedGridRow<TItem>) => ManagedGridRow<TItem>) {
    setRows((current) => current.map((row) => (row.clientId === clientId ? updater(row) : row)));
  }

  function validateSingleRow(target: ManagedGridRow<TItem>, sourceRows: ManagedGridRow<TItem>[] = rows) {
    if (target.state === 'deleted') {
      return {};
    }

    const activeRows = sourceRows
      .filter((row) => row.clientId === target.clientId || row.state !== 'deleted')
      .map((row) => (row.clientId === target.clientId ? target.current : row.current));

    return runValidation(target.current, activeRows);
  }

  function beginCellEdit(clientId: string, columnId: string) {
    setActiveCell({
      clientId,
      columnId,
    });
  }

  function finishCellEdit(clientId: string, options?: { columnId?: string }) {
    setRows((current) =>
      current.map((row) => {
        if (row.clientId !== clientId) {
          return row;
        }

        return {
          ...row,
          errors: validateSingleRow(row, current),
        };
      }),
    );

    setActiveCell((current) => {
      if (!current || current.clientId !== clientId) {
        return current;
      }

      if (options?.columnId && current.columnId !== options.columnId) {
        return current;
      }

      return null;
    });
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        clientId: createClientId(),
        current: createEmptyItem(current.length + 1),
        state: 'added',
        dirtyFields: [],
        errors: {},
      },
    ]);
  }

  async function toggleDelete(clientId: string) {
    const target = rows.find((row) => row.clientId === clientId);

    if (!target) {
      return;
    }

    if (target.state === 'added') {
      setRows((current) => current.filter((row) => row.clientId !== clientId));
      return;
    }

    if (target.state === 'deleted') {
      replaceRow(clientId, (row) => {
        const nextState = deriveRowState(row.original, row.current, 'clean');
        return {
          ...row,
          state: nextState,
          errors: {},
          dirtyFields: getDirtyFields(row.original, row.current),
        };
      });
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

    replaceRow(clientId, (row) => ({
      ...row,
      state: 'deleted',
      errors: {},
    }));

    setActiveCell((current) => (current?.clientId === clientId ? null : current));
  }

  function updateField<TKey extends Extract<keyof TItem, string>>(
    clientId: string,
    field: TKey,
    value: TItem[TKey],
  ) {
    setRows((current) => {
      const nextRows = current.map((row) => {
        if (row.clientId !== clientId || row.state === 'deleted') {
          return row;
        }

        const nextCurrent = {
          ...row.current,
          [field]: value,
        } as TItem;

        const nextState: GridRowState = deriveRowState(row.original, nextCurrent, row.state);

        return {
          ...row,
          current: nextCurrent,
          state: nextState,
          dirtyFields: getDirtyFields(row.original, nextCurrent),
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
  }

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
    setActiveCell(null);
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

      <div className="mt-6 overflow-x-auto rounded-[22px] border border-line">
        <table className="min-w-full border-separate border-spacing-0 text-left">
          <thead className="bg-[#fbfbff] text-sm font-bold text-gray-500">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`border-b border-line px-4 py-3 ${column.className ?? ''} ${column.headerClassName ?? ''}`}
                >
                  {column.title}
                </th>
              ))}
              <th className="border-b border-line px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white text-sm text-gray-700">
            {rows.map((row) => {
              const disabled = row.state === 'deleted';
              const rowIsEditing = activeCell?.clientId === row.clientId;

              return (
                <tr
                  key={row.clientId}
                  className={[
                    getRowStateClassName(row.state),
                    getRowClassName?.(row.current, row.state) ?? '',
                  ].join(' ')}
                >
                  {columns.map((column) => {
                    if (column.type === 'action') {
                      return (
                        <td key={column.id} className={`border-b border-line px-4 py-4 align-middle ${column.className ?? ''}`}>
                          {column.render({
                            row: row.current,
                            rowState: row.state,
                            isEditing: rowIsEditing,
                            disabled,
                          })}
                        </td>
                      );
                    }

                    const fieldKey = column.field;
                    const value = row.current[fieldKey];
                    const editable = resolveEditable(column, row.current);
                    const error = row.errors[fieldKey];
                    const isEditing =
                      activeCell?.clientId === row.clientId && activeCell.columnId === column.id;
                    const cellContext: GridCellContext<TItem, TItem[typeof fieldKey]> = {
                      row: row.current,
                      value,
                      rowState: row.state,
                      isEditing,
                      disabled,
                      error,
                      update: (nextValue) => updateField(row.clientId, fieldKey, nextValue),
                      commit: () => finishCellEdit(row.clientId, { columnId: column.id }),
                    };

                    return (
                      <td
                        key={column.id}
                        className={`border-b border-line px-4 py-4 align-middle ${column.className ?? ''}`}
                      >
                        <div className={disabled ? 'opacity-60' : ''}>
                          {isEditing && editable && !disabled ? (
                            <>
                              {column.editor ? (
                                column.editor(cellContext)
                              ) : (
                                <DefaultFieldEditor column={column} context={cellContext} />
                              )}
                              {error ? <p className="mt-2 text-xs font-medium text-red-500">{error}</p> : null}
                            </>
                          ) : column.render ? (
                            <button
                              type="button"
                              className={`w-full text-left ${editable && !disabled ? 'cursor-text rounded-xl px-2 py-2 transition hover:bg-white/70' : ''}`}
                              onClick={() => {
                                if (editable && !disabled) {
                                  beginCellEdit(row.clientId, column.id);
                                }
                              }}
                              disabled={!editable || disabled}
                            >
                              {column.render(cellContext)}
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={`w-full text-left ${editable && !disabled ? 'cursor-text rounded-xl px-2 py-2 transition hover:bg-white/70' : ''}`}
                              onClick={() => {
                                if (editable && !disabled) {
                                  beginCellEdit(row.clientId, column.id);
                                }
                              }}
                              disabled={!editable || disabled}
                            >
                              <DefaultFieldView column={column} context={cellContext} />
                            </button>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="border-b border-line px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={row.state === 'deleted' ? 'Restore row' : 'Delete row'}
                        className={`rounded-full p-2 transition ${
                          row.state === 'deleted'
                            ? 'text-red-600 hover:bg-red-100'
                            : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                        }`}
                        onClick={() => void toggleDelete(row.clientId)}
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
            })}
          </tbody>
        </table>
      </div>

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

function DefaultFieldView<TItem, TField extends Extract<keyof TItem, string>>({
  column,
  context,
}: {
  column: GridFieldColumn<TItem, TField>;
  context: GridCellContext<TItem, TItem[TField]>;
}) {
  if (column.type === 'switch') {
    return <AdminToggleSwitch active={Boolean(context.value)} disabled />;
  }

  if (column.type === 'checkbox') {
    return <input type="checkbox" checked={Boolean(context.value)} readOnly className="h-4 w-4 accent-primary" />;
  }

  if (column.type === 'select') {
    const matchedOption = column.options?.find((option) => option.value === context.value);
    return <span>{matchedOption?.label ?? String(context.value ?? '')}</span>;
  }

  return <span>{String(context.value ?? '')}</span>;
}

function DefaultFieldEditor<TItem, TField extends Extract<keyof TItem, string>>({
  column,
  context,
}: {
  column: GridFieldColumn<TItem, TField>;
  context: GridCellContext<TItem, TItem[TField]>;
}) {
  if (column.type === 'switch') {
    return (
      <AdminToggleSwitch
        active={Boolean(context.value)}
        disabled={context.disabled}
        onClick={() => context.update((!context.value) as TItem[TField])}
        onBlur={context.commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            context.commit();
          }
        }}
        autoFocus
      />
    );
  }

  if (column.type === 'checkbox') {
    return (
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          checked={Boolean(context.value)}
          disabled={context.disabled}
          className="h-4 w-4 accent-primary"
          onChange={(event) => context.update(event.target.checked as TItem[TField])}
          onBlur={context.commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              context.commit();
            }
          }}
          autoFocus
        />
        <span>{Boolean(context.value) ? 'Checked' : 'Unchecked'}</span>
      </label>
    );
  }

  if (column.type === 'select') {
    return (
      <select
        value={String(context.value ?? '')}
        disabled={context.disabled}
        className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        onChange={(event) => {
          const nextOption = column.options?.find((option) => String(option.value) === event.target.value);
          context.update((nextOption?.value ?? event.target.value) as TItem[TField]);
        }}
        onBlur={context.commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            context.commit();
          }
        }}
        autoFocus
      >
        <option value="">Select</option>
        {column.options?.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === 'number') {
    return (
      <input
        type="number"
        value={typeof context.value === 'number' ? context.value : ''}
        disabled={context.disabled}
        placeholder={column.placeholder}
        className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
        onChange={(event) =>
          context.update((event.target.value === '' ? 0 : Number(event.target.value)) as TItem[TField])
        }
        onBlur={context.commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            context.commit();
          }
        }}
        autoFocus
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof context.value === 'string' ? context.value : String(context.value ?? '')}
      disabled={context.disabled}
      placeholder={column.placeholder}
      className="h-11 w-full rounded-2xl border border-line bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      onChange={(event) => context.update(event.target.value as TItem[TField])}
      onBlur={context.commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          context.commit();
        }
      }}
      autoFocus
    />
  );
}
