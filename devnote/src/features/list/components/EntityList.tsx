import { closestCenter, DndContext, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useCallback, useMemo, useState } from 'react';

import { useFeedback } from '../../feedback/FeedbackContext';
import { useEntityList } from '../hooks/useEntityList';
import type { EntityListManagedRow, EntityListProps } from '../types/entityListTypes';
import { isEntityListFieldColumn } from '../utils/entityListColumns';
import { canDropEntityTreeBlock, getVisibleEntityTreeRows } from '../utils/entityListTree';
import { EntityListMobileCards } from './EntityListMobileCards';
import { EntityListStateBlock } from './EntityListStateBlock';
import { EntityListSummary } from './EntityListSummary';
import { EntityListTable } from './EntityListTable';
import { EntityListToolbar } from './EntityListToolbar';

export function EntityList<TItem extends { id?: number; order: number }, TAddContext = void>({
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
  renderAddControl,
  renderRowActions,
  tree,
}: EntityListProps<TItem, TAddContext>) {
  const { showConfirm, showMessage } = useFeedback();

  const handleSaved = useCallback(() => {
    showMessage({
      tone: 'success',
      title: `${itemLabel} 변경 사항이 저장되었습니다.`,
      description: `최신 ${itemLabel} 목록을 다시 불러왔습니다.`,
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
    moveRow,
    updateRow,
    saveList,
    updateField,
  } = useEntityList<TItem, TAddContext>({
    columns,
    createEmptyItem,
    fetchItems,
    saveItems,
    validateRow,
    onSaved: handleSaved,
    tree,
  });

  const fieldColumns = useMemo(() => columns.filter(isEntityListFieldColumn), [columns]);
  const [collapsedTreeRowIds, setCollapsedTreeRowIds] = useState<Set<string>>(() => new Set());
  const visibleRows = useMemo(
    () => (tree ? getVisibleEntityTreeRows(rows, collapsedTreeRowIds, tree) : rows),
    [collapsedTreeRowIds, rows, tree],
  );

  const toggleTreeRow = useCallback((row: TItem) => {
    if (!tree) {
      return;
    }

    const rowId = tree.getRowId(row);

    if (rowId === null || rowId === undefined) {
      return;
    }

    const rowKey = String(rowId);
    setCollapsedTreeRowIds((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
  }, [tree]);

  const sortableRowIds = useMemo(() => visibleRows.map((row) => row.clientId), [visibleRows]);
  const mobileSortableRowIds = useMemo(
    () => visibleRows.map((row) => `mobile:${row.clientId}`),
    [visibleRows],
  );

  const handleDragEnd = useCallback((event: DragEndEvent, idPrefix = '') => {
    if (!tree || !tree.draggable || !event.over || event.active.id === event.over.id) {
      return;
    }

    const activeId = String(event.active.id).replace(idPrefix, '');
    const overId = String(event.over.id).replace(idPrefix, '');
    const activeRow = rows.find((row) => row.clientId === activeId);
    const overRow = rows.find((row) => row.clientId === overId);

    if (!canDropEntityTreeBlock(activeRow, overRow, tree)) {
      showMessage({
        tone: 'warning',
        title: '같은 부모 메뉴에 속한 같은 레벨끼리만 이동할 수 있습니다.',
      });
      return;
    }

    moveRow(activeId, overId);
  }, [moveRow, rows, showMessage, tree]);

  const renderExtraRowActions = useCallback(
    (row: EntityListManagedRow<TItem>) =>
      renderRowActions?.({
        row,
        rows,
        updateRow,
      }),
    [renderRowActions, rows, updateRow],
  );

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
          title: `${itemLabel} 변경 사항을 저장하기 전에 입력 오류를 확인해 주세요.`,
        });
      }
    } catch (error) {
      showMessage({
        tone: 'error',
        title: `${itemLabel} 변경 사항을 저장하지 못했습니다.`,
        description: error instanceof Error ? error.message : '잠시 후 다시 시도해 주세요.',
      });
    }
  }, [itemLabel, saveList, showMessage]);

  if (isLoading) {
    return (
      <EntityListStateBlock tone="loading">
        {`${itemLabel} 목록을 불러오는 중입니다...`}
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
        onAdd={() => addRow()}
        onSave={() => void handleSave()}
        addControl={renderAddControl?.({ rows, onAdd: addRow })}
      />

      <DndContext collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event)}>
        <SortableContext items={sortableRowIds} strategy={verticalListSortingStrategy}>
          <EntityListTable
            rows={visibleRows}
            allRows={rows}
            fieldColumns={fieldColumns}
            editingRowIds={editingRowIds}
            emptyMessage={emptyMessage}
            getRowClassName={getRowClassName}
            onToggleEditing={toggleEditing}
            onToggleDelete={(row) => void toggleDelete(row)}
            renderRowActions={renderExtraRowActions}
            updateField={updateField}
            tree={tree}
            collapsedTreeRowIds={collapsedTreeRowIds}
            onToggleTreeRow={toggleTreeRow}
            sortableIdPrefix=""
          />
        </SortableContext>
      </DndContext>

      <DndContext collisionDetection={closestCenter} onDragEnd={(event) => handleDragEnd(event, 'mobile:')}>
        <SortableContext items={mobileSortableRowIds} strategy={verticalListSortingStrategy}>
          <EntityListMobileCards
            rows={visibleRows}
            allRows={rows}
            fieldColumns={fieldColumns}
            editingRowIds={editingRowIds}
            emptyMessage={emptyMessage}
            onToggleEditing={toggleEditing}
            onToggleDelete={(row) => void toggleDelete(row)}
            renderRowActions={renderExtraRowActions}
            updateField={updateField}
            tree={tree}
            collapsedTreeRowIds={collapsedTreeRowIds}
            onToggleTreeRow={toggleTreeRow}
            sortableIdPrefix="mobile:"
          />
        </SortableContext>
      </DndContext>

      <EntityListSummary rowCount={rows.length} changeSet={changeSet} hasChanges={hasChanges} />
    </section>
  );
}
