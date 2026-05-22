import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/menuMapping.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-menu-tests');
const outputPath = join(outputDir, `menuMapping-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const { mapMenusToAdminNavItems, mapMenusToPublicNavItems, mapMenusToSavePayload } = await import(
  pathToFileURL(outputPath).href
);

const items = mapMenusToPublicNavItems([
  { id: 2, name: 'Blog', path: '/posts', state: 'active', visible: true, order: 2, area: 'HEADER', parentId: 10, depth: 1 },
  { id: 1, name: 'Home', path: '/', state: 'active', visible: true, order: 1, area: 'HEADER', parentId: 10, depth: 1 },
  { id: 3, name: 'Hidden', path: '/hidden', state: 'active', visible: false, order: 3, area: 'HEADER', parentId: 10, depth: 1 },
  { id: 4, name: 'Admin', path: '/admin/menus', state: 'active', visible: true, order: 4, area: 'ADMIN', parentId: 20, depth: 1 },
  { id: 5, name: 'Draft', path: '/draft', state: 'inactive', visible: true, order: 5, area: 'HEADER', parentId: 10, depth: 1 },
]);

assert.deepEqual(items, [
  { label: 'Home', to: '/', end: true },
  { label: 'Blog', to: '/posts' },
  { label: 'Draft', to: '/draft' },
]);

const adminItems = mapMenusToAdminNavItems([
  { id: 10, name: 'Admin Menu', path: '/__admin-menu', state: 'system', visible: false, order: 1, area: 'ADMIN', parentId: 1, depth: 0 },
  { id: 11, name: 'Dashboard', path: '/admin', state: 'active', visible: true, order: 1, area: 'ADMIN', parentId: 10, depth: 1 },
  { id: 12, name: 'Menus', path: '/admin/menus', state: 'active', visible: true, order: 2, area: 'ADMIN', parentId: 10, depth: 1 },
  { id: 13, name: 'Home', path: '/', state: 'active', visible: true, order: 1, area: 'HEADER', parentId: 20, depth: 1 },
]);

assert.deepEqual(adminItems, [
  { label: 'Dashboard', to: '/admin', end: true },
  { label: 'Menus', to: '/admin/menus' },
]);

const payload = mapMenusToSavePayload([
  { id: 10, name: 'Admin Menu', path: '/__admin-menu', state: 'system', visible: false, order: 1, area: 'ADMIN', parentId: 1, depth: 0 },
  { id: 11, name: 'Dashboard', path: '/admin', state: 'active', visible: true, order: 1, area: 'ADMIN', parentId: 10, depth: 1 },
  { id: 12, name: 'Menus', path: '/admin/menus', state: 'active', visible: true, order: 2, area: 'ADMIN', parentId: 10, depth: 1 },
  { id: 20, name: 'Header Menu', path: '/__header-menu', state: 'system', visible: false, order: 2, area: 'HEADER', parentId: 1, depth: 0 },
  { id: 21, name: 'Home', path: '/', state: 'active', visible: true, order: 1, area: 'HEADER', parentId: 20, depth: 1 },
]);

assert.deepEqual(
  payload.map((item) => ({ id: item.id, displayOrder: item.displayOrder, area: item.area, parentId: item.parentId })),
  [
    { id: 10, displayOrder: 1, area: 'ADMIN', parentId: 1 },
    { id: 11, displayOrder: 1, area: 'ADMIN', parentId: 10 },
    { id: 12, displayOrder: 2, area: 'ADMIN', parentId: 10 },
    { id: 20, displayOrder: 2, area: 'HEADER', parentId: 1 },
    { id: 21, displayOrder: 1, area: 'HEADER', parentId: 20 },
  ],
);
