import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/dashboard.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-dashboard-api-tests');
const outputPath = join(outputDir, `dashboard-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => ({
      totalPosts: 12,
      totalViews: 3456,
      totalLikes: 87,
      totalComments: 23,
      newSubscribers: 5,
    }),
  };
};

const { getDashboardStats } = await import(pathToFileURL(outputPath).href);
const stats = await getDashboardStats();

assert.deepEqual(stats, {
  totalPosts: 12,
  totalViews: 3456,
  totalLikes: 87,
  totalComments: 23,
  newSubscribers: 5,
});
assert.deepEqual(calls, [
  {
    url: 'http://localhost:8080/api/admin/dashboard/stats',
    options: {
      credentials: 'include',
    },
  },
]);
