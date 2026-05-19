import { useCallback, useMemo } from 'react';

import { useFeedback } from '../../feedback/FeedbackContext';
import { useEntityList } from '../hooks/useEntityList';
import type { EntityListManagedRow, EntityListProps } from '../types/entityListTypes';
import { isEntityListFieldColumn } from '../utils/entityListColumns';
import { EntityListMobileCards } from './EntityListMobileCards';
import { EntityListStateBlock } from './EntityListStateBlock';
import { EntityListSummary } from './EntityListSummary';
import { EntityListTable } from './EntityListTable';
import { EntityListToolbar } from './EntityListToolbar';

export function EntityList<TItem extends { id?: number; order: number }>({
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
  emptyMessage = 'No rows available.',
}: EntityListProps<TItem>) {
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
    editingRowIds,
    isLoading,
    isSaving,
    loadError,
    changeSet,
    hasChanges,
    addRow,
    toggleEditing,
    removeAddedRow,
    restoreRow,
    markRowDeleted,
    saveList,
    updateField,
  } = useEntityList({
    columns,
    createEmptyItem,
    fetchItems,
    saveItems,
    validateRow,
    onSaved: handleSaved,
  });

  const fieldColumns = useMemo(() => columns.filter(isEntityListFieldColumn), [columns]);

  const toggleDelete = useCallback(
    async (row: EntityListManagedRow<TItem>) => {
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
        description: 'The row will not be removed from the server until you save the list.',
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
      const saved = await saveList();

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
  }, [itemLabel, saveList, showMessage]);

  if (isLoading) {
    return (
      <EntityListStateBlock tone="loading">
        {`Loading ${itemLabel.toLowerCase()} list...`}
      </EntityListStateBlock>
    );
  }

  if (loadError) {
    return <EntityListStateBlock tone="error">{loadError}</EntityListStateBlock>;
  }

  return (
    <section className="rounded-[24px] border border-line bg-white shadow-[0_18px_50px_rgba(17,24,39,0.045)]">
      <EntityListToolbar
        title={title}
        description={description}
        itemLabel={itemLabel}
        hasChanges={hasChanges}
        isSaving={isSaving}
        onAdd={addRow}
        onSave={() => void handleSave()}
      />

      <EntityListTable
        rows={rows}
        fieldColumns={fieldColumns}
        editingRowIds={editingRowIds}
        emptyMessage={emptyMessage}
        getRowClassName={getRowClassName}
        onToggleEditing={toggleEditing}
        onToggleDelete={(row) => void toggleDelete(row)}
        updateField={updateField}
      />

      <EntityListMobileCards
        rows={rows}
        fieldColumns={fieldColumns}
        editingRowIds={editingRowIds}
        emptyMessage={emptyMessage}
        onToggleEditing={toggleEditing}
        onToggleDelete={(row) => void toggleDelete(row)}
        updateField={updateField}
      />

      <EntityListSummary rowCount={rows.length} changeSet={changeSet} hasChanges={hasChanges} />
    </section>
  );
}
