import type { AdminMenuRow, MenuArea } from '../../types';

type ConcreteMenuArea = Exclude<MenuArea, 'ROOT' | ''>;

export type MenuCreateTarget =
  | { type: 'root' }
  | { type: 'child'; parentId: number };

export function isSystemAreaParent(row: AdminMenuRow) {
  return (row.depth ?? 0) === 0;
}

export function buildMenuCreateOptions(rows: AdminMenuRow[]) {
  return [
    { label: '루트', target: { type: 'root' } as MenuCreateTarget },
    ...rows
      .filter((row) => row.id && row.area !== 'ROOT')
      .map((row) => ({
        label: `${row.name} 하위`,
        target: { type: 'child', parentId: row.id as number } as MenuCreateTarget,
      })),
  ];
}

export function createMenuDraftForTarget(rows: AdminMenuRow[], target: MenuCreateTarget): AdminMenuRow {
  if (target.type === 'root') {
    return {
      name: '',
      path: '',
      state: '',
      visible: false,
      order: getNextMenuOrder(rows, 1),
      area: '',
      parentId: 1,
      depth: 0,
    };
  }

  const parent = rows.find((row) => row.id === target.parentId);
  const parentArea = parent ? resolveMenuEffectiveArea(parent) : undefined;

  return {
    name: '',
    path: '',
    state: '',
    visible: true,
    order: getNextMenuOrder(rows, target.parentId),
    area: parentArea ?? '',
    parentId: target.parentId,
    depth: (parent?.depth ?? 0) + 1,
  };
}

export function canMoveAddedMenuToChild(row: AdminMenuRow, rows: AdminMenuRow[]) {
  return findPreviousSavedMenu(row, rows) !== undefined;
}

export function moveAddedMenuToChild(row: AdminMenuRow, rows: AdminMenuRow[]): AdminMenuRow {
  const parent = findPreviousSavedMenu(row, rows);

  if (!parent?.id) {
    return row;
  }

  const parentArea = resolveMenuEffectiveArea(parent);

  return {
    ...row,
    visible: true,
    order: getNextMenuOrder(rows.filter((candidate) => candidate !== row), parent.id),
    area: parentArea ?? '',
    parentId: parent.id,
    depth: (parent.depth ?? 0) + 1,
  };
}

export function canMoveAddedMenuToParent(row: AdminMenuRow, rows: AdminMenuRow[]) {
  const parent = rows.find((candidate) => candidate.id === row.parentId);

  return Boolean(parent?.parentId);
}

export function moveAddedMenuToParent(row: AdminMenuRow, rows: AdminMenuRow[]): AdminMenuRow {
  const parent = rows.find((candidate) => candidate.id === row.parentId);

  if (!parent?.parentId) {
    return row;
  }

  const nextParent = rows.find((candidate) => candidate.id === parent.parentId);
  const nextParentId = parent.parentId;
  const nextDepth = nextParentId === 1 ? 0 : (nextParent?.depth ?? -1) + 1;
  const nextArea =
    nextParentId === 1 ? '' : nextParent ? resolveMenuEffectiveArea(nextParent) ?? '' : resolveMenuEffectiveArea(parent) ?? '';

  return {
    ...row,
    visible: nextParentId !== 1,
    order: getNextMenuOrder(rows.filter((candidate) => candidate !== row), nextParentId),
    area: nextArea,
    parentId: nextParentId,
    depth: nextDepth,
  };
}

export function resolveMenuEffectiveArea(row: AdminMenuRow): ConcreteMenuArea | undefined {
  if (row.area === 'ADMIN' || row.area === 'HEADER') {
    return row.area;
  }

  if (!isSystemAreaParent(row)) {
    return undefined;
  }

  if (row.name.includes('운영자') || row.name.toLowerCase().includes('admin')) {
    return 'ADMIN';
  }

  if (row.name.includes('헤더') || row.name.toLowerCase().includes('header')) {
    return 'HEADER';
  }

  if (row.order === 1) {
    return 'ADMIN';
  }

  if (row.order === 2) {
    return 'HEADER';
  }

  return undefined;
}

export function isMenuDescendant(
  candidate: AdminMenuRow,
  row: AdminMenuRow,
  rows: AdminMenuRow[],
) {
  let parentId = candidate.parentId;

  while (parentId) {
    if (parentId === row.id) {
      return true;
    }

    parentId = rows.find((item) => item.id === parentId)?.parentId;
  }

  return false;
}

export function getMenuParentOptions(row: AdminMenuRow, rows: AdminMenuRow[]) {
  const rowArea = resolveMenuEffectiveArea(row);

  return rows.filter((candidate) => {
    if (!candidate.id || candidate.id === row.id) {
      return false;
    }

    if (resolveMenuEffectiveArea(candidate) !== rowArea) {
      return false;
    }

    return !isMenuDescendant(candidate, row, rows);
  });
}

export function getVisibleMenuTreeRows(rows: AdminMenuRow[], collapsedIds: Set<number>) {
  return rows.filter((row) => {
    let parentId = row.parentId;

    while (parentId) {
      if (collapsedIds.has(parentId)) {
        return false;
      }

      parentId = rows.find((item) => item.id === parentId)?.parentId;
    }

    return true;
  });
}

export function validateMenuRow(row: AdminMenuRow, rows: AdminMenuRow[]): Record<string, string> {
  const errors: Record<string, string> = {};
  const normalizedPath = row.path.trim().toLowerCase();

  if (isSystemAreaParent(row)) {
    return errors;
  }

  if (row.area === 'ROOT') {
    errors.area = '루트 메뉴는 내부 관리용으로만 사용됩니다.';
  }

  if (!row.parentId) {
    errors.parentId = '부모 메뉴를 선택해 주세요.';
  }

  const parent = rows.find((candidate) => candidate.id === row.parentId);

  if (!parent) {
    errors.parentId = '존재하는 부모 메뉴를 선택해 주세요.';
  } else if (resolveMenuEffectiveArea(parent) !== resolveMenuEffectiveArea(row)) {
    errors.parentId = '부모 메뉴와 같은 영역만 선택할 수 있습니다.';
  }

  if (!normalizedPath.startsWith('/')) {
    errors.path = '메뉴 경로는 / 로 시작해야 합니다.';
  }

  if (
    rows.filter(
      (candidate) =>
        resolveMenuEffectiveArea(candidate) === resolveMenuEffectiveArea(row) &&
        candidate.path.trim().toLowerCase() === normalizedPath,
    ).length > 1
  ) {
    errors.path = '같은 영역에서 이미 사용 중인 경로입니다.';
  }

  return errors;
}

function getNextMenuOrder(rows: AdminMenuRow[], parentId: number) {
  return (
    rows
      .filter((row) => row.parentId === parentId)
      .reduce((maxOrder, row) => Math.max(maxOrder, row.order), 0) + 1
  );
}

function findPreviousSavedMenu(row: AdminMenuRow, rows: AdminMenuRow[]) {
  const rowIndex = rows.indexOf(row);

  if (rowIndex <= 0) {
    return undefined;
  }

  for (let index = rowIndex - 1; index >= 0; index -= 1) {
    const candidate = rows[index];

    if (candidate.id && candidate.area !== 'ROOT') {
      return candidate;
    }
  }

  return undefined;
}
