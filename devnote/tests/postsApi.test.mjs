import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/posts.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-post-tests');
const outputPath = join(outputDir, `posts-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return { ok: true, status: 204 };
};

const { deletePost } = await import(pathToFileURL(outputPath).href);

await deletePost('spring-boot', 'delete-me');

assert.deepEqual(calls, [
  {
    url: 'http://localhost:8080/api/posts/spring-boot/delete-me',
    options: {
      method: 'DELETE',
      credentials: 'include',
    },
  },
]);
