import type { AdminMenuApiResponse, AdminMenuRow, MenuArea, PublicNavItem } from '../types';

const ROOT_PARENT_ID = 1;

function normalizeArea(area: AdminMenuApiResponse['area'] | AdminMenuRow['area'] | undefined): MenuArea {
  return area ?? 'HEADER';
}

export function mapMenuResponseToAdminRow(menu: AdminMenuApiResponse): AdminMenuRow {
  return {
    id: menu.id,
    name: menu.name,
    path: menu.path,
    state: menu.state,
    visible: menu.visible,
    order: menu.displayOrder,
    area: normalizeArea(menu.area),
    parentId: menu.parentId ?? null,
    depth: menu.depth ?? 0,
  };
}

export function mapMenusToPublicNavItems(menus: AdminMenuRow[]): PublicNavItem[] {
  return [...menus]
    .filter((menu) => normalizeArea(menu.area) === 'HEADER')
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

export function mapMenusToAdminNavItems(menus: AdminMenuRow[]): PublicNavItem[] {
  return mapMenusToNavItems(menus, 'ADMIN');
}

function mapMenusToNavItems(menus: AdminMenuRow[], area: MenuArea): PublicNavItem[] {
  return [...menus]
    .filter((menu) => normalizeArea(menu.area) === area)
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
      ...(menu.path === '/' || menu.path === '/admin' ? { end: true } : {}),
    }));
}

export function mapMenusToSavePayload(items: AdminMenuRow[]) {
  const siblingIndexes = new Map<string, number>();

  return items.map((item) => {
    const area = normalizeArea(item.area);
    const siblingKey = String(item.parentId ?? ROOT_PARENT_ID);
    const displayOrder = (siblingIndexes.get(siblingKey) ?? 0) + 1;
    siblingIndexes.set(siblingKey, displayOrder);

    return {
    id: item.id,
    name: item.name,
    path: item.path,
    state: item.state,
    visible: item.visible,
      displayOrder,
      area,
      parentId: item.parentId ?? ROOT_PARENT_ID,
    };
  });
}
