import type { AdminMenuApiResponse, AdminMenuRow, PublicNavItem } from '../types';

export function mapMenuResponseToAdminRow(menu: AdminMenuApiResponse): AdminMenuRow {
  return {
    id: menu.id,
    name: menu.name,
    path: menu.path,
    state: menu.state,
    visible: menu.visible,
    order: menu.displayOrder,
  };
}

export function mapMenusToPublicNavItems(menus: AdminMenuRow[]): PublicNavItem[] {
  return [...menus]
    .filter((menu) => menu.visible)
    .map((menu) => ({
      ...menu,
      name: menu.name.trim(),
      path: menu.path.trim(),
    }))
    .filter((menu) => menu.name.length > 0 && menu.path.length > 0)
    .sort((left, right) => left.order - right.order)
    .map((menu) => ({
      label: menu.name,
      to: menu.path,
      ...(menu.path === '/' ? { end: true } : {}),
    }));
}

export function mapMenusToSavePayload(items: AdminMenuRow[]) {
  return items.map((item, index) => ({
    id: item.id,
    name: item.name,
    path: item.path,
    state: item.state,
    visible: item.visible,
    displayOrder: index + 1,
  }));
}
