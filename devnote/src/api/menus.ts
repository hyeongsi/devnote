import type { AdminMenuApiResponse, AdminMenuRow } from '../types';

const MENUS_API_URL = 'http://localhost:8080/api/menus';

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

  return menus.map((menu) => ({
    id: menu.id,
    name: menu.name,
    path: menu.path,
    state: menu.state,
    visible: menu.visible,
    order: menu.displayOrder,
  }));
}

export async function saveAdminMenus(items: AdminMenuRow[]): Promise<void> {
  const response = await fetch(`${MENUS_API_URL}/admin`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(
      items.map((item, index) => ({
        id: item.id,
        name: item.name,
        path: item.path,
        state: item.state,
        visible: item.visible,
        displayOrder: index + 1,
      })),
    ),
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`메뉴 변경 사항을 저장하지 못했습니다. (${response.status})`);
  }
}
