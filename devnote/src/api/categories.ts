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
    throw new Error(`관리 카테고리 목록을 불러오지 못했습니다. (${response.status})`);
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
