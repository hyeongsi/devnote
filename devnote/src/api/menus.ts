import type { AdminMenuApiResponse, AdminMenuRow } from '../types';
import { mapMenuResponseToAdminRow, mapMenusToPublicNavItems, mapMenusToSavePayload } from './menuMapping';

const MENUS_API_URL = 'http://localhost:8080/api/menus';
export const MENUS_CHANGED_EVENT = 'devnote:menus-changed';

export async function getPublicMenus() {
  const response = await fetch(MENUS_API_URL);

  if (!response.ok) {
    throw new Error(`메뉴 목록을 불러오지 못했습니다. (${response.status})`);
  }

  const menus = (await response.json()) as AdminMenuApiResponse[];

  return mapMenusToPublicNavItems(menus.map(mapMenuResponseToAdminRow));
}

export async function getAdminMenus(): Promise<AdminMenuRow[]> {
  const response = await fetch(`${MENUS_API_URL}/admin`, {
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`메뉴 목록을 불러오지 못했습니다. (${response.status})`);
  }

  const menus = (await response.json()) as AdminMenuApiResponse[];

  return menus.map(mapMenuResponseToAdminRow);
}

export async function saveAdminMenus(items: AdminMenuRow[]): Promise<void> {
  const response = await fetch(`${MENUS_API_URL}/admin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(mapMenusToSavePayload(items)),
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`메뉴 변경 사항을 저장하지 못했습니다. (${response.status})`);
  }

  notifyMenusChanged();
}

export function notifyMenusChanged() {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new Event(MENUS_CHANGED_EVENT));
}
