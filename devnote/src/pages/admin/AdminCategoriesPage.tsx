import { getAdminCategories, saveAdminCategories } from '../../api/categories';
import {
  AdminEditableGrid,
  type AdminEditableGridColumn,
} from '../../features/admin/AdminEditableGrid';
import type { AdminCategoryRow } from '../../types';

const columns: AdminEditableGridColumn<AdminCategoryRow>[] = [
  {
    id: 'name',
    title: '카테고리명',
    type: 'text',
    field: 'name',
    required: true,
    placeholder: '예: Spring Boot',
    render: ({ value }) => <span className="font-semibold text-gray-900">{value}</span>,
  },
  {
    id: 'slug',
    title: '슬러그',
    type: 'text',
    field: 'slug',
    required: true,
    placeholder: '예: spring-boot',
    render: ({ value }) => <span className="font-mono text-xs text-gray-500">{value}</span>,
  },
  {
    id: 'description',
    title: '설명',
    type: 'text',
    field: 'description',
    required: true,
    placeholder: '카테고리 설명을 입력해 주세요.',
    className: 'min-w-[260px]',
    render: ({ value }) => <span className="text-gray-500">{value}</span>,
  },
  {
    id: 'postCount',
    title: '게시글 수',
    type: 'number',
    field: 'postCount',
    editable: false,
    className: 'w-28',
    render: ({ value }) => <span className="font-semibold text-gray-700">{value}</span>,
  },
  {
    id: 'visible',
    title: '노출',
    type: 'switch',
    field: 'visible',
    className: 'w-28',
  },
];

function validateCategoryRow(
  row: AdminCategoryRow,
  rows: AdminCategoryRow[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalizedSlug = row.slug?.trim().toLowerCase();

  if (
    normalizedSlug &&
    rows.filter((candidate) => candidate.slug?.trim().toLowerCase() === normalizedSlug).length > 1
  ) {
    errors.slug = '같은 슬러그를 가진 카테고리가 이미 있습니다.';
  }

  return errors;
}

export function AdminCategoriesPage() {
  return (
    <AdminEditableGrid
      title="카테고리 관리"
      description="그리드에서 바로 값을 수정하고, 추가/수정/삭제 상태를 한 번에 저장할 수 있습니다."
      itemLabel="Category"
      columns={columns}
      fetchItems={getAdminCategories}
      saveItems={saveAdminCategories}
      getItemName={(item) => item.name}
      validateRow={validateCategoryRow}
      createEmptyItem={(nextOrder) => ({
        slug: '',
        name: '',
        description: '',
        postCount: 0,
        visible: true,
        order: nextOrder,
      })}
    />
  );
}
