import { CornerDownRight, CornerUpLeft } from 'lucide-react';

import { getAdminMenus, saveAdminMenus } from '../../api/menus';
import {
  EntityList,
  type EntityListColumn,
  type EntityListManagedRow,
} from '../../features/list';
import type { AdminMenuRow } from '../../types';
import {
  canMoveAddedMenuToChild,
  canMoveAddedMenuToParent,
  createMenuDraftForTarget,
  isSystemAreaParent,
  moveAddedMenuToChild,
  moveAddedMenuToParent,
  validateMenuRow,
} from './adminMenuTree';

const columns: EntityListColumn<AdminMenuRow>[] = [
  {
    id: 'name',
    title: '메뉴명',
    type: 'text',
    field: 'name',
    required: true,
    placeholder: '홈',
    className: 'min-w-56',
    render: ({ row, value }) => (
      <span className={`block font-semibold ${isSystemAreaParent(row) ? 'text-gray-950' : 'text-gray-800'}`}>
        {value}
      </span>
    ),
  },
  {
    id: 'path',
    title: '경로',
    type: 'text',
    field: 'path',
    required: false,
    placeholder: '/posts',
    editable: (row) => !isSystemAreaParent(row),
    render: ({ value }) => <span className="font-mono text-xs text-gray-500">{value}</span>,
  },
  {
    id: 'visible',
    title: '노출',
    type: 'switch',
    field: 'visible',
    editable: (row) => !isSystemAreaParent(row),
    className: 'w-28',
  },
];

export function AdminMenusPage() {
  return (
    <EntityList
      title="메뉴 관리"
      description="헤더와 운영자 메뉴를 트리 구조로 함께 관리합니다. 같은 부모 메뉴 아래의 항목은 드래그로 순서를 바꿀 수 있습니다."
      itemLabel="메뉴"
      columns={columns}
      fetchItems={getAdminMenus}
      saveItems={saveAdminMenus}
      getItemName={(item) => item.name}
      validateRow={validateMenuRow}
      getRowClassName={(row) => (isSystemAreaParent(row) ? 'bg-gray-50/80' : '')}
      tree={{
        getRowId: (item) => item.id,
        getParentId: (item) => item.parentId,
        getDepth: (item) => item.depth ?? 0,
        draggable: true,
      }}
      renderRowActions={({ row, rows, updateRow }) => (
        <AddedMenuStructureActions row={row} rows={rows} updateRow={updateRow} />
      )}
      createEmptyItem={(_nextOrder, _target, rows = []) =>
        createMenuDraftForTarget(
          rows.map((row) => row.current),
          { type: 'root' },
        )
      }
    />
  );
}

function AddedMenuStructureActions({
  row,
  rows,
  updateRow,
}: {
  row: EntityListManagedRow<AdminMenuRow>;
  rows: EntityListManagedRow<AdminMenuRow>[];
  updateRow: (clientId: string, updater: (row: AdminMenuRow, rows: AdminMenuRow[]) => AdminMenuRow) => void;
}) {
  if (row.state !== 'added') {
    return null;
  }

  const menuRows = rows.map((entry) => entry.current);
  const canMoveToChild = canMoveAddedMenuToChild(row.current, menuRows);
  const canMoveToParent = canMoveAddedMenuToParent(row.current, menuRows);

  return (
    <>
      <button
        type="button"
        aria-label="하위 메뉴로 이동"
        title="하위 메뉴로 이동"
        className={`rounded-lg border border-transparent p-2 transition ${
          canMoveToChild
            ? 'text-gray-500 hover:border-line hover:bg-white hover:text-primary'
            : 'cursor-not-allowed text-gray-300'
        }`}
        disabled={!canMoveToChild}
        onClick={() => updateRow(row.clientId, moveAddedMenuToChild)}
      >
        <CornerDownRight className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="상위 메뉴로 이동"
        title="상위 메뉴로 이동"
        className={`rounded-lg border border-transparent p-2 transition ${
          canMoveToParent
            ? 'text-gray-500 hover:border-line hover:bg-white hover:text-primary'
            : 'cursor-not-allowed text-gray-300'
        }`}
        disabled={!canMoveToParent}
        onClick={() => updateRow(row.clientId, moveAddedMenuToParent)}
      >
        <CornerUpLeft className="h-4 w-4" />
      </button>
    </>
  );
}
