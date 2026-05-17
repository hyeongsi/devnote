import { useEffect, useState } from 'react';
import { getAdminCategories } from '../../api/categories';
import { AdminTable } from '../../features/admin/AdminTable';
import type { AdminCategoryRow } from '../../types';

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
  const [rows, setRows] = useState<AdminCategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setIsLoading(true);
      setError(null);

      try {
        const nextRows = await getAdminCategories();

        if (!cancelled) {
          setRows(nextRows);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '관리 카테고리 목록을 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <section className="rounded-[28px] border border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
        관리 카테고리 목록을 불러오는 중입니다.
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-medium text-red-600 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
        {error}
      </section>
    );
  }

  return (
    <AdminTable
      title="카테고리 관리"
      description="게시글 카테고리를 생성하고 관리합니다."
      actionLabel="카테고리 추가"
      rows={rows}
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
