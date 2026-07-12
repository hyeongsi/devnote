import type { AdminMenuApiResponse, AdminMenuRow } from '../types';
import {
  mapMenuResponseToAdminRow,
  mapMenusToAdminNavItems,
  mapMenusToPublicNavItems,
  mapMenusToSavePayload,
} from './menuMapping';
import { apiRequest } from './http';

const MENUS_API_URL = '/api/menus';
export const MENUS_CHANGED_EVENT = 'devnote:menus-changed';

export async function getPublicMenus() {
  const menus = await apiRequest<AdminMenuApiResponse[]>(MENUS_API_URL, {
    errorMessage: '메뉴 목록을 불러오지 못했습니다.',
  });

  return mapMenusToPublicNavItems(menus.map(mapMenuResponseToAdminRow));
}

export async function getAdminMenus(): Promise<AdminMenuRow[]> {
  const menus = await apiRequest<AdminMenuApiResponse[]>(`${MENUS_API_URL}/admin`, {
    withCredentials: true,
    statusMessages: {
      401: 'UNAUTHORIZED',
    },
    errorMessage: '메뉴 목록을 불러오지 못했습니다.',
  });

  return menus.map(mapMenuResponseToAdminRow);
}

export async function getAdminSidebarMenus() {
  const menus = await apiRequest<AdminMenuApiResponse[]>(`${MENUS_API_URL}/admin/sidebar`, {
    withCredentials: true,
    errorMessage: '운영자 메뉴 목록을 불러오지 못했습니다.',
  });

  return mapMenusToAdminNavItems(menus.map(mapMenuResponseToAdminRow));
}

export async function saveAdminMenus(items: AdminMenuRow[]): Promise<void> {
  await apiRequest<void, ReturnType<typeof mapMenusToSavePayload>>(`${MENUS_API_URL}/admin`, {
    method: 'PUT',
    withCredentials: true,
    body: mapMenusToSavePayload(items),
    statusMessages: {
      401: 'UNAUTHORIZED',
    },
    errorMessage: '메뉴 변경 사항을 저장하지 못했습니다.',
  });

  notifyMenusChanged();
}

export function notifyMenusChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(MENUS_CHANGED_EVENT));
}
