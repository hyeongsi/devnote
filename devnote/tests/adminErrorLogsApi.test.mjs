import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const source = await readFile(new URL('../src/api/errorLogs.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});
const outputDir = join(tmpdir(), 'devnote-error-log-api-tests');
const outputPath = join(outputDir, `errorLogs-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => url.endsWith('/1')
      ? { id: 1, stackTrace: 'java.lang.RuntimeException: boom' }
      : [{ id: 1, path: '/api/posts' }],
  };
};

const { getErrorLogs, getErrorLogDetail } = await import(pathToFileURL(outputPath).href);

await getErrorLogs();
await getErrorLogDetail(1);

assert.deepEqual(calls, [
  {
    url: '/api/admin/error-logs',
    options: {
      credentials: 'include',
    },
  },
  {
    url: '/api/admin/error-logs/1',
    options: {
      credentials: 'include',
    },
  },
]);

const typesSource = await readFile(new URL('../src/types.ts', import.meta.url), 'utf8');
assert.match(typesSource, /export interface ErrorLogSummary/);
assert.match(typesSource, /export interface ErrorLogDetail/);

const seedSource = await readFile(new URL('../../devnote-webapp/src/main/resources/data.sql', import.meta.url), 'utf8');
assert.match(seedSource, /\/admin\/error-logs/);
