import type { AdminMenuRow } from '../../types';

export function isSystemAreaParent(row: AdminMenuRow) {
  return (row.depth ?? 0) === 0;
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
    errors.area = 'Root is internal only.';
  }

  if (!row.parentId) {
    errors.parentId = 'Parent menu is required.';
  }

  const parent = rows.find((candidate) => candidate.id === row.parentId);

  if (!parent) {
    errors.parentId = 'Select an existing parent menu.';
  } else if (parent.area !== row.area && parent.area !== 'ROOT') {
    errors.parentId = 'Parent menu must use the same area.';
  }

  if (!normalizedPath.startsWith('/')) {
    errors.path = 'Menu path must start with /.';
  }

  if (
    rows.filter(
      (candidate) =>
        candidate.area === row.area && candidate.path.trim().toLowerCase() === normalizedPath,
    ).length > 1
  ) {
    errors.path = 'Another menu in this area already uses this path.';
  }

  return errors;
}
