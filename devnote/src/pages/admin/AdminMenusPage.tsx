import { adminMenuRows } from '../../data/siteData';
import type { AdminMenuRow } from '../../types';
import { AdminTable } from '../../features/admin/AdminTable';

const columns = [
  {
    key: 'name',
    title: '메뉴명',
    render: (row: AdminMenuRow) => <span className="font-semibold text-gray-900">{row.name}</span>,
  },
  {
    key: 'path',
    title: '링크',
    render: (row: AdminMenuRow) => <span className="text-gray-500">{row.path}</span>,
  },
  {
    key: 'state',
    title: '상태 메뉴',
    render: (row: AdminMenuRow) => <span className="text-gray-500">{row.state}</span>,
  },
  {
    key: 'visible',
    title: '노출',
    render: (row: AdminMenuRow) => <ToggleSwitch active={row.visible} />,
  },
  {
    key: 'order',
    title: '순서',
    render: (row: AdminMenuRow) => <span className="font-semibold text-gray-700">{row.order}</span>,
  },
];

export function AdminMenusPage() {
  return (
    <AdminTable
      title="메뉴 관리"
      description="사이트 내비게이션에 표시할 메뉴를 관리합니다."
      actionLabel="메뉴 추가"
      rows={adminMenuRows}
      columns={columns}
      getRowKey={(row) => row.id}
    />
  );
}

function ToggleSwitch({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex h-7 w-12 items-center rounded-full p-1 transition ${
        active ? 'bg-primary' : 'bg-gray-200'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow transition ${
          active ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </span>
  );
}
