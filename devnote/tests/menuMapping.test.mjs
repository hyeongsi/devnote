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

const { mapMenusToPublicNavItems } = await import(pathToFileURL(outputPath).href);

const items = mapMenusToPublicNavItems([
  { id: 2, name: 'Blog', path: '/posts', state: 'active', visible: true, order: 2 },
  { id: 1, name: 'Home', path: '/', state: 'active', visible: true, order: 1 },
  { id: 3, name: 'Hidden', path: '/hidden', state: 'active', visible: false, order: 3 },
  { id: 4, name: 'Admin', path: '/admin/menus', state: 'active', visible: true, order: 4 },
  { id: 5, name: 'Draft', path: '/draft', state: 'inactive', visible: true, order: 5 },
]);

assert.deepEqual(items, [
  { label: 'Home', to: '/', end: true },
  { label: 'Blog', to: '/posts' },
  { label: 'Admin', to: '/admin/menus' },
  { label: 'Draft', to: '/draft' },
]);
