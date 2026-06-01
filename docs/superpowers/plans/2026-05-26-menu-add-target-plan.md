# Menu Add Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메뉴 관리에서 신규 메뉴를 추가할 때 루트 하위 영역 메뉴로 만들지, 선택한 부모 메뉴의 자식으로 만들지 결정할 수 있게 한다.

**Architecture:** 공통 `EntityList`는 추가 컨텍스트를 받을 수 있는 작은 확장만 담당하고, 메뉴 전용 위치 선택 규칙은 `AdminMenusPage`와 `adminMenuTree` 유틸에 둔다. 신규 메뉴의 `parentId`, `area`, `depth`, `order`는 선택한 추가 대상에서 계산하여 저장 전 검증과 드래그 정렬 규칙을 그대로 통과하게 한다.

**Tech Stack:** React, TypeScript, existing EntityList abstraction, existing menu tree utilities, Node-based test scripts.

---

## File Structure

- Modify `devnote/src/features/list/types/entityListTypes.ts`
  - `createEmptyItem`이 선택 컨텍스트를 받을 수 있도록 타입 확장.
  - `EntityList`에 선택 기반 추가 UI를 주입할 수 있는 선택적 prop 추가.
- Modify `devnote/src/features/list/hooks/useEntityList.ts`
  - `addRow(context?)` 형태로 확장.
  - 컨텍스트 기반 생성 후 새 행을 편집 상태로 진입시키는 기존 동작 유지.
- Modify `devnote/src/features/list/components/EntityList.tsx`
  - toolbar의 기본 추가 버튼과 메뉴 전용 추가 제어를 연결.
  - 현재 rows를 추가 제어 컴포넌트에 전달.
- Modify `devnote/src/features/list/components/EntityListToolbar.tsx`
  - 기본 추가 버튼 대신 선택적 `addControl` 슬롯을 렌더링.
- Modify `devnote/src/pages/admin/AdminMenusPage.tsx`
  - “루트 메뉴 추가”, “선택한 메뉴의 하위 메뉴 추가” UI 제공.
  - 루트 메뉴는 Root 바로 아래 영역 메뉴를 의미하며 화면에는 `운영자`, `헤더`와 같은 depth 0 메뉴로 생성.
  - 자식 메뉴는 선택한 부모 아래 같은 영역의 실제 메뉴로 생성.
- Modify `devnote/src/pages/admin/adminMenuTree.ts`
  - 추가 대상 옵션, 신규 메뉴 기본값 계산, sibling order 계산 유틸 추가.
- Test `devnote/tests/adminMenuTree.test.mjs`
  - 루트 하위 영역 메뉴 생성 기본값 테스트.
  - 운영자/헤더 부모 선택 시 자식 메뉴 기본값 테스트.
  - 자식 메뉴 order가 같은 parentId sibling 기준 마지막으로 계산되는지 테스트.

---

### Task 1: Add Menu Creation Utility Tests

**Files:**
- Modify: `devnote/tests/adminMenuTree.test.mjs`
- Modify later: `devnote/src/pages/admin/adminMenuTree.ts`

- [ ] **Step 1: Write failing tests for creation defaults**

Add these assertions to `devnote/tests/adminMenuTree.test.mjs` after the existing imports:

```js
const {
  buildMenuCreateOptions,
  createMenuDraftForTarget,
  getMenuParentOptions,
  getVisibleMenuTreeRows,
  validateMenuRow,
} = await import(pathToFileURL(outputPath).href);
```

Add these rows to the existing `rows` fixture:

```js
const rows = [
  { id: 2, name: '운영자', path: '', state: '', visible: false, order: 1, area: '', parentId: 1, depth: 0 },
  { id: 4, name: '대시보드', path: '/admin', state: '', visible: true, order: 1, area: 'ADMIN', parentId: 2, depth: 1 },
  { id: 5, name: '게시글 관리', path: '/posts', state: '', visible: true, order: 2, area: 'ADMIN', parentId: 2, depth: 1 },
  { id: 3, name: '헤더', path: '', state: '', visible: false, order: 2, area: '', parentId: 1, depth: 0 },
  { id: 9, name: '홈', path: '/', state: '', visible: true, order: 1, area: 'HEADER', parentId: 3, depth: 1 },
];
```

Add new assertions:

```js
assert.deepEqual(
  buildMenuCreateOptions(rows).map((option) => option.label),
  ['루트', '운영자 하위', '대시보드 하위', '게시글 관리 하위', '헤더 하위', '홈 하위'],
);

assert.deepEqual(createMenuDraftForTarget(rows, { type: 'root' }), {
  name: '',
  path: '',
  state: '',
  visible: false,
  order: 3,
  area: '',
  parentId: 1,
  depth: 0,
});

assert.deepEqual(createMenuDraftForTarget(rows, { type: 'child', parentId: 2 }), {
  name: '',
  path: '',
  state: '',
  visible: true,
  order: 3,
  area: 'ADMIN',
  parentId: 2,
  depth: 1,
});

assert.deepEqual(createMenuDraftForTarget(rows, { type: 'child', parentId: 3 }), {
  name: '',
  path: '',
  state: '',
  visible: true,
  order: 2,
  area: 'HEADER',
  parentId: 3,
  depth: 1,
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
node tests/adminMenuTree.test.mjs
```

Expected: FAIL because `buildMenuCreateOptions` and `createMenuDraftForTarget` are not exported yet.

---

### Task 2: Implement Menu Creation Utilities

**Files:**
- Modify: `devnote/src/pages/admin/adminMenuTree.ts`
- Test: `devnote/tests/adminMenuTree.test.mjs`

- [ ] **Step 1: Add target types and utilities**

Add this code to `devnote/src/pages/admin/adminMenuTree.ts`:

```ts
export type MenuCreateTarget =
  | { type: 'root' }
  | { type: 'child'; parentId: number };

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

function getNextMenuOrder(rows: AdminMenuRow[], parentId: number) {
  return (
    rows
      .filter((row) => row.parentId === parentId)
      .reduce((maxOrder, row) => Math.max(maxOrder, row.order), 0) + 1
  );
}
```

- [ ] **Step 2: Run the menu utility test**

Run:

```bash
node tests/adminMenuTree.test.mjs
```

Expected: PASS.

---

### Task 3: Extend EntityList Add Context

**Files:**
- Modify: `devnote/src/features/list/types/entityListTypes.ts`
- Modify: `devnote/src/features/list/hooks/useEntityList.ts`

- [ ] **Step 1: Extend generic types**

Change `EntityListProps` in `devnote/src/features/list/types/entityListTypes.ts` to accept an add context:

```ts
export interface EntityListAddControlContext<TItem extends { id?: number; order: number }, TAddContext> {
  rows: EntityListManagedRow<TItem>[];
  onAdd: (context?: TAddContext) => void;
}

export interface EntityListProps<TItem extends { id?: number; order: number }, TAddContext = void> {
  title: string;
  description: string;
  itemLabel: string;
  columns: EntityListColumn<TItem>[];
  createEmptyItem: (nextOrder: number, context?: TAddContext, rows?: EntityListManagedRow<TItem>[]) => TItem;
  fetchItems: () => Promise<TItem[]>;
  saveItems: (items: TItem[], changes: EntityListChangeSet<TItem>) => Promise<void>;
  getItemName: (item: TItem) => string;
  validateRow?: (row: TItem, rows: TItem[]) => Record<string, string>;
  getRowClassName?: (row: TItem, state: EntityRowState) => string;
  emptyMessage?: string;
  renderAddControl?: (context: EntityListAddControlContext<TItem, TAddContext>) => ReactNode;
  tree?: {
    getRowId: (row: TItem) => number | string | undefined;
    getParentId: (row: TItem) => number | string | null | undefined;
    getDepth?: (row: TItem) => number;
    draggable?: boolean;
  };
}
```

- [ ] **Step 2: Update `useEntityList` generic signatures**

Update the hook signature:

```ts
interface UseEntityListOptions<TItem extends { id?: number; order: number }, TAddContext> {
  columns: EntityListColumn<TItem>[];
  createEmptyItem: EntityListProps<TItem, TAddContext>['createEmptyItem'];
  fetchItems: EntityListProps<TItem, TAddContext>['fetchItems'];
  saveItems: EntityListProps<TItem, TAddContext>['saveItems'];
  validateRow?: EntityListProps<TItem, TAddContext>['validateRow'];
  onSaved: () => void;
  tree?: EntityListProps<TItem, TAddContext>['tree'];
}

export function useEntityList<TItem extends { id?: number; order: number }, TAddContext = void>({
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  validateRow,
  onSaved,
  tree,
}: UseEntityListOptions<TItem, TAddContext>) {
```

Update `addRow`:

```ts
const addRow = useCallback((context?: TAddContext) => {
  const clientId = createEntityListRowId();

  setRows((current) => [
    ...current,
    {
      clientId,
      original: undefined,
      current: createEmptyItem(current.length + 1, context, current),
      state: 'added',
      dirtyFields: [],
      errors: {},
    },
  ]);
  setEditingRowIds((current) => [...current, clientId]);
}, [createEmptyItem]);
```

- [ ] **Step 3: Run build**

Run:

```bash
npm.cmd run build
```

Expected: TypeScript may fail until Task 4 wires the new generic through `EntityList`; continue to Task 4 before final verification.

---

### Task 4: Wire Add Control Through EntityList UI

**Files:**
- Modify: `devnote/src/features/list/components/EntityList.tsx`
- Modify: `devnote/src/features/list/components/EntityListToolbar.tsx`

- [ ] **Step 1: Add toolbar slot**

Change `EntityListToolbarProps` in `devnote/src/features/list/components/EntityListToolbar.tsx`:

```ts
interface EntityListToolbarProps {
  title: string;
  description: string;
  itemLabel: string;
  hasChanges: boolean;
  isSaving: boolean;
  onAdd: () => void;
  onSave: () => void;
  addControl?: ReactNode;
}
```

Import `ReactNode`:

```ts
import type { ReactNode } from 'react';
```

Render the slot where the add button currently renders:

```tsx
{addControl ?? (
  <button
    type="button"
    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(109,93,252,0.18)] transition hover:brightness-105"
    onClick={onAdd}
  >
    <Plus className="h-4 w-4" />
    {itemLabel} 추가
  </button>
)}
```

- [ ] **Step 2: Add generic add context to EntityList**

Change `EntityList` signature in `devnote/src/features/list/components/EntityList.tsx`:

```ts
export function EntityList<TItem extends { id?: number; order: number }, TAddContext = void>({
  title,
  description,
  itemLabel,
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  getItemName,
  validateRow,
  getRowClassName,
  emptyMessage = 'No rows available.',
  renderAddControl,
  tree,
}: EntityListProps<TItem, TAddContext>) {
```

Pass the generic to `useEntityList`:

```ts
const {
  rows,
  editingRowIds,
  isLoading,
  isSaving,
  loadError,
  changeSet,
  hasChanges,
  addRow,
  toggleEditing,
  removeAddedRow,
  restoreRow,
  markRowDeleted,
  moveRow,
  saveList,
  updateField,
} = useEntityList<TItem, TAddContext>({
  columns,
  createEmptyItem,
  fetchItems,
  saveItems,
  validateRow,
  onSaved: handleSaved,
  tree,
});
```

Pass `addControl`:

```tsx
<EntityListToolbar
  title={title}
  description={description}
  itemLabel={itemLabel}
  hasChanges={hasChanges}
  isSaving={isSaving}
  onAdd={() => addRow()}
  onSave={() => void handleSave()}
  addControl={renderAddControl?.({ rows, onAdd: addRow })}
/>
```

- [ ] **Step 3: Run build**

Run:

```bash
npm.cmd run build
```

Expected: PASS if the generic wiring is correct.

---

### Task 5: Add Menu-Specific Target Picker

**Files:**
- Modify: `devnote/src/pages/admin/AdminMenusPage.tsx`
- Test: `devnote/tests/adminMenuTree.test.mjs`

- [ ] **Step 1: Import new utilities and icons**

Update imports in `devnote/src/pages/admin/AdminMenusPage.tsx`:

```ts
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  buildMenuCreateOptions,
  createMenuDraftForTarget,
  isSystemAreaParent,
  type MenuCreateTarget,
  validateMenuRow,
} from './adminMenuTree';
```

- [ ] **Step 2: Add menu add control component**

Add below `columns`:

```tsx
function MenuAddControl({
  rows,
  onAdd,
}: {
  rows: Array<{ current: AdminMenuRow }>;
  onAdd: (target: MenuCreateTarget) => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState('0');
  const options = useMemo(
    () => buildMenuCreateOptions(rows.map((row) => row.current)),
    [rows],
  );
  const selectedOption = options[Number(selectedIndex)] ?? options[0];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        className="h-10 rounded-xl border border-line bg-white px-3 text-sm font-semibold text-gray-700"
        value={selectedIndex}
        onChange={(event) => setSelectedIndex(event.target.value)}
        aria-label="메뉴 추가 위치"
      >
        {options.map((option, index) => (
          <option key={`${option.label}-${index}`} value={String(index)}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-[0_10px_24px_rgba(109,93,252,0.18)] transition hover:brightness-105"
        onClick={() => onAdd(selectedOption.target)}
      >
        <Plus className="h-4 w-4" />
        메뉴 추가
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Wire menu-specific creation**

Change the `EntityList` usage:

```tsx
<EntityList<AdminMenuRow, MenuCreateTarget>
  ...
  renderAddControl={({ rows, onAdd }) => <MenuAddControl rows={rows} onAdd={onAdd} />}
  createEmptyItem={(nextOrder, target, rows = []) =>
    createMenuDraftForTarget(
      rows.map((row) => row.current),
      target ?? { type: 'root' },
    )
  }
/>
```

Keep `nextOrder` in the signature even though menu creation uses tree sibling order, because other EntityList callers still use the old linear default.

- [ ] **Step 4: Run menu tests and build**

Run:

```bash
node tests/adminMenuTree.test.mjs
npm.cmd run build
```

Expected: both PASS.

---

### Task 6: Validation and Save Behavior Check

**Files:**
- Modify only if needed: `devnote/src/features/list/hooks/useEntityList.ts`
- Test: `devnote/tests/adminMenuTree.test.mjs`, `devnote/tests/entityListTree.test.mjs`

- [ ] **Step 1: Verify added root area menu validates as system parent**

Run:

```bash
node tests/adminMenuTree.test.mjs
```

Expected: PASS. Root-level area menu has `depth: 0`, so `validateMenuRow` returns `{}` even with empty path.

- [ ] **Step 2: Verify child menu drag behavior remains unchanged**

Run:

```bash
node tests/entityListTree.test.mjs
```

Expected: PASS. Drag ordering still only allows same-parent movement.

- [ ] **Step 3: Verify full app**

Run:

```bash
npm.cmd run lint
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 4: Verify backend tests**

Run from `devnote-webapp`:

```bash
.\gradlew.bat test
```

Expected: BUILD SUCCESSFUL.

---

## UX Decisions

- Toolbar shows a compact select + “메뉴 추가” button.
- Select options:
  - `루트`: creates a Root child, displayed as a top-level area menu in the admin grid.
  - `{메뉴명} 하위`: creates a child under that menu.
- Newly added root-level menu:
  - `parentId: 1`
  - `depth: 0`
  - `area: ''`
  - `path: ''`
  - `state: ''`
  - `visible: false`
- Newly added child menu:
  - `parentId` is selected parent id.
  - `depth` is parent depth + 1.
  - `area` is selected parent’s effective area.
  - `order` is last among siblings under the selected parent.
  - `visible: true`

## Self-Review

- Spec coverage: The plan covers choosing root vs child, default values, sibling order, validation, and existing drag behavior.
- Placeholder scan: No implementation placeholders remain.
- Type consistency: `MenuCreateTarget`, `renderAddControl`, and `createEmptyItem(nextOrder, context, rows)` are used consistently across tasks.
