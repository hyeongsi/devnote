import { Plus, Save } from 'lucide-react';
import { memo } from 'react';
import type { ReactNode } from 'react';

interface EntityListToolbarProps {
  title: string;
  description: string;
  itemLabel: string;
  hasChanges: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
  addControl?: ReactNode;
}

export const EntityListToolbar = memo(function EntityListToolbar({
  title,
  description,
  itemLabel,
  hasChanges,
  isSaving,
  onAdd,
  onSave,
  addControl,
}: EntityListToolbarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-line px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
      <div>
        <h2 className="text-xl font-extrabold tracking-tight text-gray-950">{title}</h2>
        <p className="mt-1.5 text-sm leading-6 text-muted">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition ${
            hasChanges && !isSaving
              ? 'bg-primary shadow-[0_10px_24px_rgba(109,93,252,0.18)] hover:brightness-105'
              : 'cursor-not-allowed bg-gray-300 shadow-none'
          }`}
          onClick={onSave}
          disabled={!hasChanges || isSaving}
        >
          <Save className="h-4 w-4" />
          {isSaving ? '저장 중...' : '변경 사항 저장'}
        </button>
        {addControl ?? (
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(109,93,252,0.18)] transition hover:brightness-105"
            onClick={onAdd}
          >
            <Plus className="h-4 w-4" />
            {itemLabel} 추가
          </button>
        )}
      </div>
    </div>
  );
});
