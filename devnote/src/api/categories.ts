import type {
  AdminCategoryApiResponse,
  AdminCategoryRow,
  BlogCategory,
  BlogCategoryApiResponse,
} from '../types';
import { fetchAdmin } from './adminAuth';
import { apiRequest } from './http';

const CATEGORIES_API_URL = '/api/categories';

export async function getBlogCategories(): Promise<BlogCategory[]> {
  const categories = await apiRequest<BlogCategoryApiResponse[]>(CATEGORIES_API_URL, {
    errorMessage: '카테고리 목록을 불러오지 못했습니다.',
  });

  return categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      count: category.count,
      visible: category.visible,
      displayOrder: category.displayOrder,
    }))
    .sort((left, right) => (left.displayOrder ?? 0) - (right.displayOrder ?? 0));
}

export async function getAdminCategories(): Promise<AdminCategoryRow[]> {
  const categories = await apiRequest<AdminCategoryApiResponse[]>(`${CATEGORIES_API_URL}/admin`, {
    request: fetchAdmin,
    errorMessage: '관리자 카테고리 목록을 불러오지 못했습니다.',
  });

  return categories
    .map((category) => ({
      id: category.id,
      slug: category.slug,
      name: category.name,
      description: category.description,
      postCount: category.postCount,
      visible: category.visible,
      order: category.displayOrder,
    }))
    .sort((left, right) => left.order - right.order);
}

export async function saveAdminCategories(items: AdminCategoryRow[]): Promise<void> {
  await apiRequest<void, AdminCategorySaveRequest[]>(`${CATEGORIES_API_URL}/admin`, {
    method: 'PUT',
    request: fetchAdmin,
    body: mapCategoriesToSavePayload(items),
    errorMessage: '카테고리 변경 사항을 저장하지 못했습니다.',
  });
}

interface AdminCategorySaveRequest {
  id?: number;
  slug?: string;
  name: string;
  description: string;
  visible: boolean;
  displayOrder: number;
}

function mapCategoriesToSavePayload(items: AdminCategoryRow[]): AdminCategorySaveRequest[] {
  return items.map((item, index) => ({
    id: item.id,
    slug: item.slug,
    name: item.name,
    description: item.description,
    visible: item.visible,
    displayOrder: index + 1,
  }));
}
