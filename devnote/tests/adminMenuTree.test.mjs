import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/pages/admin/adminMenuTree.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-menu-tests');
const outputPath = join(outputDir, `adminMenuTree-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const {
  buildMenuCreateOptions,
  createMenuDraftForTarget,
  canMoveAddedMenuToChild,
  canMoveAddedMenuToParent,
  moveAddedMenuToChild,
  moveAddedMenuToParent,
  getMenuParentOptions,
  getVisibleMenuTreeRows,
  validateMenuRow,
} = await import(pathToFileURL(outputPath).href);

const rows = [
  { id: 2, name: '운영자', path: '', state: '', visible: false, order: 1, area: '', parentId: 1, depth: 0 },
  { id: 4, name: '대시보드', path: '/admin', state: '', visible: true, order: 1, area: 'ADMIN', parentId: 2, depth: 1 },
  { id: 5, name: '게시글 관리', path: '/posts', state: '', visible: true, order: 2, area: 'ADMIN', parentId: 2, depth: 1 },
  { id: 3, name: '헤더', path: '', state: '', visible: false, order: 2, area: '', parentId: 1, depth: 0 },
  { id: 9, name: '홈', path: '/', state: '', visible: true, order: 1, area: 'HEADER', parentId: 3, depth: 1 },
];

assert.deepEqual(validateMenuRow(rows[0], rows), {});
assert.deepEqual(validateMenuRow({ ...rows[1], name: '대시보드 수정' }, rows), {});
assert.deepEqual(validateMenuRow({ ...rows[1], path: '', state: '' }, rows), {
  path: '메뉴 경로는 / 로 시작해야 합니다.',
});
assert.deepEqual(
  getMenuParentOptions(rows[1], rows).map((row) => row.name),
  ['운영자', '게시글 관리'],
);

assert.deepEqual(
  getVisibleMenuTreeRows(rows, new Set([2])).map((row) => row.name),
  ['운영자', '헤더', '홈'],
);

assert.deepEqual(
  getVisibleMenuTreeRows(rows, new Set()).map((row) => row.name),
  ['운영자', '대시보드', '게시글 관리', '헤더', '홈'],
);

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

const addedRootMenu = {
  name: '',
  path: '',
  state: '',
  visible: false,
  order: 3,
  area: '',
  parentId: 1,
  depth: 0,
};

assert.equal(canMoveAddedMenuToChild(addedRootMenu, [...rows, addedRootMenu]), true);
assert.deepEqual(moveAddedMenuToChild(addedRootMenu, [...rows, addedRootMenu]), {
  ...addedRootMenu,
  visible: true,
  order: 1,
  area: 'HEADER',
  parentId: 9,
  depth: 2,
});

const addedHeaderChild = {
  name: '',
  path: '',
  state: '',
  visible: true,
  order: 2,
  area: 'HEADER',
  parentId: 3,
  depth: 1,
};

assert.equal(canMoveAddedMenuToParent(addedHeaderChild, [...rows, addedHeaderChild]), true);
assert.deepEqual(moveAddedMenuToParent(addedHeaderChild, [...rows, addedHeaderChild]), {
  ...addedHeaderChild,
  visible: false,
  order: 3,
  area: '',
  parentId: 1,
  depth: 0,
});
