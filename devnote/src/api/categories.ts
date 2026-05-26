import type {
  AdminCategoryApiResponse,
  AdminCategoryRow,
  BlogCategory,
  BlogCategoryApiResponse,
} from '../types';

const CATEGORIES_API_URL = 'http://localhost:8080/api/categories';

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const response = await fetch(CATEGORIES_API_URL);

  if (!response.ok) {
    throw new Error(`카테고리 목록을 불러오지 못했습니다. (${response.status})`);
  }

  const categories = (await response.json()) as BlogCategoryApiResponse[];

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    count: category.count,
    visible: category.visible,
    displayOrder: category.displayOrder,
  }));
}

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const response = await fetch(`${CATEGORIES_API_URL}/admin`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`관리자 카테고리 목록을 불러오지 못했습니다. (${response.status})`);
  }

  const categories = (await response.json()) as AdminCategoryApiResponse[];

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    postCount: category.postCount,
    visible: category.visible,
    order: category.displayOrder,
  }));
}

export async function saveAdminCategories(items: AdminCategoryRow[]): Promise<void> {
  const response = await fetch(`${CATEGORIES_API_URL}/admin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(
      items.map((item, index) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description,
        visible: item.visible,
        displayOrder: index + 1,
      })),
    ),
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`카테고리 변경 사항을 저장하지 못했습니다. (${response.status})`);
  }
}
