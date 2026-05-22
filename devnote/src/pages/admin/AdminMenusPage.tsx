import { getAdminMenus, saveAdminMenus } from '../../api/menus';
import {
  EntityList,
  type EntityListCellContext,
  type EntityListColumn,
} from '../../features/list';
import type { AdminMenuRow, MenuArea } from '../../types';
import { isMenuDescendant, isSystemAreaParent, validateMenuRow } from './adminMenuTree';

const menuStateOptions = [
  { label: 'Active', value: 'Active' },
  { label: 'Preparing', value: 'Preparing' },
  { label: 'Inactive', value: 'Inactive' },
] as const;

const menuAreaOptions = [
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Header', value: 'HEADER' },
] as const;

function getAreaLabel(area: MenuArea | undefined) {
  if (area === 'ADMIN') {
    return 'Admin';
  }

  if (area === 'HEADER') {
    return 'Header';
  }

  return 'Root';
}

function renderParentEditor({
  row,
  rows,
  value,
  update,
}: EntityListCellContext<AdminMenuRow, AdminMenuRow[keyof AdminMenuRow]>) {
  const parentId = typeof value === 'number' ? value : '';
  const parentOptions = rows.filter((candidate) => {
    if (!candidate.id || candidate.id === row.id) {
      return false;
    }

    if (candidate.area !== row.area) {
      return false;
    }

    return !isMenuDescendant(candidate, row, rows);
  });

  return (
    <select
      value={parentId}
      className="h-10 w-full rounded-lg border border-line bg-white px-3 text-sm font-medium text-gray-700 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
      onChange={(event) => update(Number(event.target.value))}
    >
      <option value="" disabled>
        Select parent
      </option>
      {parentOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {`${'  '.repeat(option.depth ?? 0)}${option.name}`}
        </option>
      ))}
    </select>
  );
}

const columns: EntityListColumn<AdminMenuRow>[] = [
  {
    id: 'name',
    title: 'Menu',
    type: 'text',
    field: 'name',
    required: true,
    placeholder: 'Home',
    className: 'min-w-56',
    render: ({ row, value }) => (
      <span className={`block font-semibold ${isSystemAreaParent(row) ? 'text-gray-950' : 'text-gray-800'}`}>
        {value}
      </span>
    ),
  },
  {
    id: 'area',
    title: 'Area',
    type: 'select',
    field: 'area',
    required: true,
    options: [...menuAreaOptions],
    editable: (row) => !isSystemAreaParent(row),
    className: 'w-32',
    render: ({ value }) => (
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
        {getAreaLabel(value as MenuArea | undefined)}
      </span>
    ),
  },
  {
    id: 'parentId',
    title: 'Parent',
    type: 'number',
    field: 'parentId',
    editable: (row) => !isSystemAreaParent(row),
    className: 'min-w-48',
    editor: renderParentEditor,
    render: ({ row, rows }) => {
      if (isSystemAreaParent(row)) {
        return <span className="text-xs font-semibold text-gray-400">ROOT child</span>;
      }

      const parent = rows.find((item) => item.id === row.parentId);
      return <span className="text-sm text-gray-600">{parent?.name ?? '-'}</span>;
    },
  },
  {
    id: 'path',
    title: 'Path',
    type: 'text',
    field: 'path',
    required: true,
    placeholder: '/posts',
    editable: (row) => !isSystemAreaParent(row),
    render: ({ value }) => <span className="font-mono text-xs text-gray-500">{value}</span>,
  },
  {
    id: 'state',
    title: 'State',
    type: 'select',
    field: 'state',
    required: true,
    options: [...menuStateOptions],
    className: 'w-36',
  },
  {
    id: 'visible',
    title: 'Visible',
    type: 'switch',
    field: 'visible',
    editable: (row) => !isSystemAreaParent(row),
    className: 'w-28',
  },
];

export function AdminMenusPage() {
  return (
    <EntityList
      title="Menu Management"
      description="Manage header and admin sidebar menus together as a tree. ROOT is kept internal."
      itemLabel="Menu"
      columns={columns}
      fetchItems={getAdminMenus}
      saveItems={saveAdminMenus}
      getItemName={(item) => item.name}
      validateRow={validateMenuRow}
      getRowClassName={(row) => (isSystemAreaParent(row) ? 'bg-gray-50/80' : '')}
      tree={{
        getRowId: (item) => item.id,
        getParentId: (item) => item.parentId,
        getDepth: (item) => item.depth ?? 0,
      }}
      createEmptyItem={(nextOrder) => ({
        name: '',
        path: '',
        state: 'Active',
        visible: true,
        order: nextOrder,
        area: 'HEADER' as const,
        parentId: null,
        depth: 1,
      })}
    />
  );
}
