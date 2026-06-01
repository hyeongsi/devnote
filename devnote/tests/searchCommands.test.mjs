import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/features/searchCommands.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-search-command-tests');
const outputPath = join(outputDir, `search-commands-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const { getSearchCommandPath, isSearchShortcut, shouldSearchPosts } = await import(pathToFileURL(outputPath).href);

assert.equal(getSearchCommandPath('/admin'), '/admin');
assert.equal(getSearchCommandPath(' /admin '), '/admin');
assert.equal(getSearchCommandPath('/admin '), '/admin');
assert.equal(getSearchCommandPath('admin'), null);
assert.equal(getSearchCommandPath('/posts'), null);

assert.equal(shouldSearchPosts('/admin'), false);
assert.equal(shouldSearchPosts(' /admin '), false);
assert.equal(shouldSearchPosts('a'), false);
assert.equal(shouldSearchPosts('spring'), true);

assert.equal(isSearchShortcut({ key: 'k', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }), true);
assert.equal(isSearchShortcut({ key: 'K', ctrlKey: false, metaKey: true, altKey: false, shiftKey: false }), true);
assert.equal(isSearchShortcut({ key: 'k', ctrlKey: true, metaKey: false, altKey: true, shiftKey: false }), false);
assert.equal(isSearchShortcut({ key: 'j', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false }), false);
