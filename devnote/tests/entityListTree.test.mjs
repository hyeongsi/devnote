import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/features/list/utils/entityListTree.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-menu-tests');
const outputPath = join(outputDir, `entityListTree-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const { canDropEntityTreeBlock, getEntityTreeInsertIndex, getEntityTreeSubtreeRows, moveEntityTreeBlock } = await import(
  pathToFileURL(outputPath).href
);

const rows = [
  { clientId: 'admin', current: { id: 2, name: 'Admin', parentId: 1, order: 1 }, original: { id: 2, name: 'Admin', parentId: 1, order: 1 }, state: 'clean', dirtyFields: [], errors: {} },
  { clientId: 'dashboard', current: { id: 4, name: 'Dashboard', parentId: 2, order: 1 }, original: { id: 4, name: 'Dashboard', parentId: 2, order: 1 }, state: 'clean', dirtyFields: [], errors: {} },
  { clientId: 'posts', current: { id: 5, name: 'Posts', parentId: 2, order: 2 }, original: { id: 5, name: 'Posts', parentId: 2, order: 2 }, state: 'clean', dirtyFields: [], errors: {} },
  { clientId: 'header', current: { id: 3, name: 'Header', parentId: 1, order: 2 }, original: { id: 3, name: 'Header', parentId: 1, order: 2 }, state: 'clean', dirtyFields: [], errors: {} },
  { clientId: 'home', current: { id: 9, name: 'Home', parentId: 3, order: 1 }, original: { id: 9, name: 'Home', parentId: 3, order: 1 }, state: 'clean', dirtyFields: [], errors: {} },
  { clientId: 'blog', current: { id: 10, name: 'Blog', parentId: 3, order: 2 }, original: { id: 10, name: 'Blog', parentId: 3, order: 2 }, state: 'clean', dirtyFields: [], errors: {} },
];

const tree = {
  getRowId: (row) => row.id,
  getParentId: (row) => row.parentId,
};

assert.deepEqual(
  getEntityTreeSubtreeRows(rows[0], rows, tree).map((row) => row.clientId),
  ['admin', 'dashboard', 'posts'],
);
assert.equal(canDropEntityTreeBlock(rows[1], rows[2], tree), true);
assert.equal(canDropEntityTreeBlock(rows[1], rows[4], tree), false);
assert.equal(canDropEntityTreeBlock(rows[0], rows[3], tree), true);
assert.equal(getEntityTreeInsertIndex(rows, { id: undefined, name: '', parentId: 2, order: 3 }, tree), 3);
assert.equal(getEntityTreeInsertIndex(rows, { id: undefined, name: '', parentId: 3, order: 3 }, tree), 6);
assert.equal(getEntityTreeInsertIndex(rows, { id: undefined, name: '', parentId: 1, order: 3 }, tree), 6);

const movedChild = moveEntityTreeBlock(rows, 'posts', 'dashboard', tree);
assert.deepEqual(
  movedChild.map((row) => row.clientId),
  ['admin', 'posts', 'dashboard', 'header', 'home', 'blog'],
);
assert.equal(movedChild[1].state, 'modified');
assert.equal(movedChild[2].state, 'modified');

const movedParent = moveEntityTreeBlock(rows, 'admin', 'header', tree);
assert.deepEqual(
  movedParent.map((row) => row.clientId),
  ['header', 'home', 'blog', 'admin', 'dashboard', 'posts'],
);
assert.equal(movedParent[0].state, 'modified');
assert.equal(movedParent[3].state, 'modified');

assert.equal(moveEntityTreeBlock(rows, 'dashboard', 'home', tree), rows);
