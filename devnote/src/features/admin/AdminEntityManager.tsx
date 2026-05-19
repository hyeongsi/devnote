import { Pencil, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useFeedback } from '../feedback/FeedbackContext';

type PrimitiveFieldType = 'text' | 'textarea' | 'switch';

export interface AdminEntityColumn<TItem> {
  key: string;
  title: string;
  render: (
    row: TItem,
    helpers: {
      updateRow: (updater: (current: TItem) => TItem) => void;
      disabled: boolean;
    },
  ) => ReactNode;
  className?: string;
}

export interface AdminEntityField<TItem> {
  key: keyof TItem;
  label: string;
  type: PrimitiveFieldType;
  placeholder?: string;
  required?: boolean;
  description?: string;
}

export interface AdminEntityManagerProps<TItem extends { id?: number; order: number }> {
  title: string;
  description: string;
  itemLabel: string;
  columns: AdminEntityColumn<TItem>[];
  fields: AdminEntityField<TItem>[];
  createEmptyItem: (nextOrder: number) => TItem;
  fetchItems: () => Promise<TItem[]>;
  saveItems: (items: TItem[]) => Promise<void>;
  getItemName: (item: TItem) => string;
  getRowClassName?: (row: TItem) => string;
}

type DraftItem<TItem> = TItem & {
  _clientId: string;
  _isNew?: boolean;
  _isPendingDelete?: boolean;
};

interface ModalState<TItem> {
  mode: 'create' | 'edit';
  clientId?: string;
  formData: TItem;
}

function createClientId() {
  return `draft-${crypto.randomUUID()}`;
}

function toDraftItem<TItem extends { id?: number; order: number }>(
  item: TItem,
  options?: {
    clientId?: string;
    isNew?: boolean;
    isPendingDelete?: boolean;
  },
): DraftItem<TItem> {
  return {
    ...item,
    _clientId: options?.clientId ?? createClientId(),
    _isNew: options?.isNew ?? false,
    _isPendingDelete: options?.isPendingDelete ?? false,
  };
}

function stripDraftFields<TItem extends { id?: number; order: number }>(
  item: DraftItem<TItem>,
): TItem {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !key.startsWith('_')),
  ) as TItem;
}

function normalizeStringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

function sanitizeComparable(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeComparable(entry));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !key.startsWith('_'))
      .sort(([left], [right]) => left.localeCompare(right))
      .reduce<Record<string, unknown>>((accumulator, [key, entryValue]) => {
        accumulator[key] = sanitizeComparable(entryValue);
        return accumulator;
      }, {});
  }

  return normalizeStringValue(value);
}

function compareDrafts<TItem extends { id?: number; order: number }>(
  source: DraftItem<TItem>[],
  draft: DraftItem<TItem>[],
) {
  return JSON.stringify(sanitizeComparable(source)) !== JSON.stringify(sanitizeComparable(draft));
}

export function AdminEntityManager<TItem extends { id?: number; order: number }>({
  title,
  description,
  itemLabel,
  columns,
  fields,
  createEmptyItem,
  fetchItems,
  saveItems,
  getItemName,
  getRowClassName,
}: AdminEntityManagerProps<TItem>) {
  const { showMessage } = useFeedback();
  const [sourceItems, setSourceItems] = useState<DraftItem<TItem>[]>([]);
  const [draftItems, setDraftItems] = useState<DraftItem<TItem>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalState, setModalState] = useState<ModalState<TItem> | null>(null);

  const dirty = useMemo(() => compareDrafts(sourceItems, draftItems), [draftItems, sourceItems]);

  const loadItems = useCallback(async (options?: { keepMessage?: boolean }) => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const rows = await fetchItems();
      const nextDrafts = rows.map((item) => toDraftItem(item));
      setSourceItems(nextDrafts);
      setDraftItems(nextDrafts);

      if (options?.keepMessage) {
        showMessage({
          tone: 'success',
          title: `${itemLabel} 변경 사항이 저장되었습니다.`,
          description: `최신 ${itemLabel} 목록을 다시 불러왔습니다.`,
        });
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : `${itemLabel} 목록을 불러오는 중 문제가 발생했습니다.`;
      setLoadError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchItems, itemLabel, showMessage]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadItems();
    });
  }, [loadItems]);

  const deletedCount = draftItems.filter((item) => item._isPendingDelete).length;

  function openCreateModal() {
    setModalState({
      mode: 'create',
      formData: createEmptyItem(draftItems.length + 1),
    });
  }

  function openEditModal(clientId: string) {
    const target = draftItems.find((item) => item._clientId === clientId);

    if (!target) {
      return;
    }

    setModalState({
      mode: 'edit',
      clientId,
      formData: stripDraftFields(target),
    });
  }

  function closeModal() {
    setModalState(null);
  }

  function updateModalField<TKey extends keyof TItem>(key: TKey, value: TItem[TKey]) {
    setModalState((current) =>
      current
        ? {
            ...current,
            formData: {
              ...current.formData,
              [key]: value,
            },
          }
        : current,
    );
  }

  function updateDraftItem(clientId: string, updater: (current: TItem) => TItem) {
    setDraftItems((current) =>
      current.map((item) =>
        item._clientId === clientId
          ? {
              ...item,
              ...updater(stripDraftFields(item)),
            }
          : item,
      ),
    );
  }

  function saveModalItem() {
    if (!modalState) {
      return;
    }

    const missingField = fields.find((field) => {
      if (!field.required) {
        return false;
      }

      const value = modalState.formData[field.key];

      if (field.type === 'switch') {
        return false;
      }

      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missingField) {
      showMessage({
        tone: 'warning',
        title: `${missingField.label} 값을 확인해주세요.`,
      });
      return;
    }

    if (modalState.mode === 'create') {
      setDraftItems((current) => [
        ...current,
        toDraftItem(modalState.formData, {
          isNew: true,
        }),
      ]);
      showMessage({
        tone: 'info',
        title: `${itemLabel}가 저장 대기 상태로 추가되었습니다.`,
      });
    } else {
      setDraftItems((current) =>
        current.map((item) =>
          item._clientId === modalState.clientId
            ? {
                ...item,
                ...modalState.formData,
              }
            : item,
        ),
      );
      showMessage({
        tone: 'info',
        title: `${itemLabel} 수정 사항이 저장 대기 상태로 반영되었습니다.`,
      });
    }

    closeModal();
  }

  async function togglePendingDelete(clientId: string) {
    const target = draftItems.find((item) => item._clientId === clientId);

    if (!target) {
      return;
    }

    if (target._isPendingDelete) {
      setDraftItems((current) =>
        current.map((item) =>
          item._clientId === clientId
            ? {
                ...item,
                _isPendingDelete: false,
              }
            : item,
        ),
      );
      showMessage({
        tone: 'info',
        title: `${getItemName(target)} 삭제 표시를 되돌렸습니다.`,
      });
      return;
    }

    setDraftItems((current) =>
      current.map((item) =>
        item._clientId === clientId
          ? {
              ...item,
              _isPendingDelete: true,
            }
          : item,
      ),
    );
    showMessage({
      tone: 'warning',
      title: `${getItemName(target)} 항목이 삭제 대기 상태로 변경되었습니다.`,
    });
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const activeItems = draftItems
        .filter((item) => !item._isPendingDelete)
        .map((item, index) => ({
          ...stripDraftFields(item),
          order: index + 1,
        }));

      await saveItems(activeItems);
      await loadItems({ keepMessage: true });
    } catch (error) {
      showMessage({
        tone: 'error',
        title: `${itemLabel} 변경 사항 저장에 실패했습니다.`,
        description:
          error instanceof Error ? error.message : '잠시 후 다시 시도해주세요.',
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
        {itemLabel} 목록을 불러오는 중입니다.
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
    <>
      <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)] md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-black tracking-tight text-gray-950">{title}</h2>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(109,93,252,0.2)] transition ${
                dirty && !isSaving
                  ? 'bg-primary hover:brightness-105'
                  : 'cursor-not-allowed bg-gray-300 shadow-none'
              }`}
              onClick={() => void handleSave()}
              disabled={!dirty || isSaving}
            >
              <Save className="h-4 w-4" />
              {isSaving ? '저장 중...' : '저장'}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(109,93,252,0.26)]"
              onClick={openCreateModal}
            >
              + {itemLabel} 추가
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[22px] border border-line">
          <table className="min-w-full border-separate border-spacing-0 text-left">
            <thead className="bg-[#fbfbff] text-sm font-bold text-gray-500">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className={`border-b border-line px-4 py-3 ${column.className ?? ''}`}>
                    {column.title}
                  </th>
                ))}
                <th className="border-b border-line px-4 py-3">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white text-sm text-gray-700">
              {draftItems.map((row) => {
                const pendingDelete = row._isPendingDelete;

                return (
                  <tr
                    key={row._clientId}
                    className={[
                      pendingDelete ? 'bg-red-50' : 'even:bg-[#fdfdff]',
                      getRowClassName?.(stripDraftFields(row)) ?? '',
                    ].join(' ')}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className="border-b border-line px-4 py-4 align-middle">
                        <div className={pendingDelete ? 'opacity-65' : ''}>
                          {column.render(stripDraftFields(row), {
                            updateRow: (updater) => updateDraftItem(row._clientId, updater),
                            disabled: Boolean(pendingDelete),
                          })}
                        </div>
                      </td>
                    ))}
                    <td className="border-b border-line px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="수정"
                          className="transition hover:text-primary disabled:cursor-not-allowed disabled:text-gray-300"
                          onClick={() => openEditModal(row._clientId)}
                          disabled={pendingDelete}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          aria-label={pendingDelete ? '삭제 복구' : '삭제'}
                          className={`transition ${
                            pendingDelete ? 'text-red-500 hover:text-red-700' : 'hover:text-red-500'
                          }`}
                          onClick={() => void togglePendingDelete(row._clientId)}
                        >
                          {pendingDelete ? <RotateCcw className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
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
          <span>추가, 수정, 삭제 대기 상태를 확인한 뒤 저장 버튼으로 한 번에 반영할 수 있습니다.</span>
          <span className={dirty ? 'text-primary' : ''}>
            {dirty
              ? `저장되지 않은 변경 사항이 있습니다${deletedCount > 0 ? ` · 삭제 대기 ${deletedCount}건` : ''}.`
              : '저장된 최신 상태입니다.'}
          </span>
        </div>
      </section>

      {modalState ? (
        <div className="fixed inset-0 z-[75] flex items-center justify-center bg-gray-950/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_90px_rgba(17,24,39,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-gray-950">
                  {modalState.mode === 'create' ? `${itemLabel} 추가` : `${itemLabel} 수정`}
                </h3>
                <p className="mt-2 text-sm text-muted">
                  변경 내용은 저장 버튼을 누르기 전까지 서버에 반영되지 않습니다.
                </p>
              </div>
              <button
                type="button"
                aria-label="닫기"
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                onClick={closeModal}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {fields.map((field) => {
                const value = modalState.formData[field.key];
                const fieldId = `modal-field-${String(field.key)}`;
                const baseWrapperClassName = field.type === 'textarea' ? 'md:col-span-2' : '';

                return (
                  <label key={String(field.key)} htmlFor={fieldId} className={`block ${baseWrapperClassName}`}>
                    <span className="text-sm font-bold text-gray-700">{field.label}</span>
                    {field.description ? (
                      <span className="mt-1 block text-xs text-muted">{field.description}</span>
                    ) : null}

                    {field.type === 'textarea' ? (
                      <textarea
                        id={fieldId}
                        value={typeof value === 'string' ? value : ''}
                        placeholder={field.placeholder}
                        className="mt-2 min-h-28 w-full rounded-2xl border border-line px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                        onChange={(event) =>
                          updateModalField(field.key, event.target.value as TItem[typeof field.key])
                        }
                      />
                    ) : null}

                    {field.type === 'text' ? (
                      <input
                        id={fieldId}
                        value={typeof value === 'string' ? value : ''}
                        placeholder={field.placeholder}
                        className="mt-2 h-12 w-full rounded-2xl border border-line px-4 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                        onChange={(event) =>
                          updateModalField(field.key, event.target.value as TItem[typeof field.key])
                        }
                      />
                    ) : null}

                    {field.type === 'switch' ? (
                      <button
                        id={fieldId}
                        type="button"
                        className={`mt-2 inline-flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                          value
                            ? 'border-primary/20 bg-primary-soft text-primary'
                            : 'border-line bg-white text-gray-500'
                        }`}
                        onClick={() => updateModalField(field.key, (!value) as TItem[typeof field.key])}
                      >
                        <span>{value ? '노출' : '숨김'}</span>
                        <span
                          className={`inline-flex h-7 w-12 items-center rounded-full p-1 ${
                            value ? 'bg-primary' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`h-5 w-5 rounded-full bg-white shadow transition ${
                              value ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </span>
                      </button>
                    ) : null}
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-2xl border border-line px-4 py-2.5 text-sm font-bold text-gray-600 transition hover:bg-gray-50"
                onClick={closeModal}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-2xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-105"
                onClick={saveModalItem}
              >
                적용
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
