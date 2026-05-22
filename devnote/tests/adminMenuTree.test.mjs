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

const { getVisibleMenuTreeRows, validateMenuRow } = await import(pathToFileURL(outputPath).href);

const rows = [
  { id: 2, name: 'Admin Menu', path: '/__admin-menu', state: 'SYSTEM', visible: false, order: 1, area: 'ADMIN', parentId: 1, depth: 0 },
  { id: 4, name: 'Dashboard', path: '/admin', state: 'Active', visible: true, order: 1, area: 'ADMIN', parentId: 2, depth: 1 },
  { id: 5, name: 'Posts', path: '/posts', state: 'Active', visible: true, order: 2, area: 'ADMIN', parentId: 2, depth: 1 },
  { id: 3, name: 'Header Menu', path: '/__header-menu', state: 'SYSTEM', visible: false, order: 2, area: 'HEADER', parentId: 1, depth: 0 },
  { id: 9, name: 'Home', path: '/', state: 'Active', visible: true, order: 1, area: 'HEADER', parentId: 3, depth: 1 },
];

assert.deepEqual(validateMenuRow(rows[0], rows), {});
assert.deepEqual(validateMenuRow({ ...rows[1], name: 'Dashboard Updated' }, rows), {});

assert.deepEqual(
  getVisibleMenuTreeRows(rows, new Set([2])).map((row) => row.name),
  ['Admin Menu', 'Header Menu', 'Home'],
);

assert.deepEqual(
  getVisibleMenuTreeRows(rows, new Set()).map((row) => row.name),
  ['Admin Menu', 'Dashboard', 'Posts', 'Header Menu', 'Home'],
);
