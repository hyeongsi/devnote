import type { EntityListChangeSet } from '../types/entityListTypes';

interface EntityListSummaryProps<TItem> {
  rowCount: number;
  changeSet: EntityListChangeSet<TItem>;
  hasChanges: boolean;
}

export function EntityListSummary<TItem>({
  rowCount,
  changeSet,
  hasChanges,
}: EntityListSummaryProps<TItem>) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 text-xs font-bold text-gray-500 md:px-6">
      <span className="rounded-full bg-gray-50 px-3 py-1.5 ring-1 ring-gray-100">Rows {rowCount}</span>
      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-100">
        Added {changeSet.added.length}
      </span>
      <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-700 ring-1 ring-amber-100">
        Modified {changeSet.modified.length}
      </span>
      <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700 ring-1 ring-red-100">
        Deleted {changeSet.deleted.length}
      </span>
      <span className={`ml-auto ${hasChanges ? 'text-primary' : 'text-gray-400'}`}>
        {hasChanges ? 'Unsaved changes' : 'Up to date'}
      </span>
    </div>
  );
}
