import { getAdminMenus, saveAdminMenus } from '../../api/menus';
import {
  EditableGrid,
  type EditableGridColumn,
} from '../../features/grid';
import type { AdminMenuRow } from '../../types';

const menuStateOptions = [
  { label: '운영 중', value: '운영 중' },
  { label: '준비 중', value: '준비 중' },
  { label: '비활성', value: '비활성' },
] as const;

const columns: EditableGridColumn<AdminMenuRow>[] = [
  {
    id: 'name',
    title: '메뉴명',
    type: 'text',
    field: 'name',
    required: true,
    placeholder: '예: 블로그',
    render: ({ value }) => <span className="font-semibold text-gray-900">{value}</span>,
  },
  {
    id: 'path',
    title: '경로',
    type: 'text',
    field: 'path',
    required: true,
    placeholder: '예: /posts',
    render: ({ value }) => <span className="font-mono text-xs text-gray-500">{value}</span>,
  },
  {
    id: 'state',
    title: '상태',
    type: 'select',
    field: 'state',
    required: true,
    options: [...menuStateOptions],
    className: 'w-40',
  },
  {
    id: 'visible',
    title: '노출',
    type: 'switch',
    field: 'visible',
    className: 'w-28',
  },
];

function validateMenuRow(row: AdminMenuRow, rows: AdminMenuRow[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalizedPath = row.path.trim().toLowerCase();

  if (!normalizedPath.startsWith('/')) {
    errors.path = '메뉴 경로는 / 로 시작해야 합니다.';
  }

  if (rows.filter((candidate) => candidate.path.trim().toLowerCase() === normalizedPath).length > 1) {
    errors.path = '같은 경로를 가진 메뉴가 이미 있습니다.';
  }

  return errors;
}

export function AdminMenusPage() {
  return (
    <EditableGrid
      title="메뉴 관리"
      description="행 단위 편집 모드로 메뉴 속성을 조정하고 저장 직전에 변경 diff를 관리합니다."
      itemLabel="Menu"
      columns={columns}
      fetchItems={getAdminMenus}
      saveItems={saveAdminMenus}
      getItemName={(item) => item.name}
      validateRow={validateMenuRow}
      createEmptyItem={(nextOrder) => ({
        name: '',
        path: '',
        state: '운영 중',
        visible: true,
        order: nextOrder,
      })}
    />
  );
}
