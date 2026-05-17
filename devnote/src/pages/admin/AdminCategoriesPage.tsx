import { adminCategoryRows } from '../../data/siteData';
import type { AdminCategoryRow } from '../../types';
import { AdminTable } from '../../features/admin/AdminTable';

const columns = [
  {
    key: 'name',
    title: '카테고리명',
    render: (row: AdminCategoryRow) => <span className="font-semibold text-gray-900">{row.name}</span>,
  },
  {
    key: 'description',
    title: '설명',
    render: (row: AdminCategoryRow) => <span className="text-gray-500">{row.description}</span>,
  },
  {
    key: 'postCount',
    title: '게시글 수',
    render: (row: AdminCategoryRow) => <span className="font-semibold text-gray-700">{row.postCount}</span>,
  },
  {
    key: 'visible',
    title: '노출',
    render: (row: AdminCategoryRow) => <ToggleSwitch active={row.visible} />,
  },
  {
    key: 'order',
    title: '순서',
    render: (row: AdminCategoryRow) => <span className="font-semibold text-gray-700">{row.order}</span>,
  },
];

export function AdminCategoriesPage() {
  return (
    <AdminTable
      title="카테고리 관리"
      description="게시글 카테고리를 생성하고 관리합니다."
      actionLabel="카테고리 추가"
      rows={adminCategoryRows}
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
