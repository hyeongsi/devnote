import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(new URL('../src/api/errorLogs.ts', import.meta.url), 'errorLogs');

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

await getErrorLogs({
  keyword: 'posts',
  status: '503',
  method: 'GET',
  from: '2026-06-01',
  to: '2026-06-30',
});
await getErrorLogDetail(1);

assert.deepEqual(calls, [
  {
    url: '/api/admin/error-logs?keyword=posts&status=503&method=GET&from=2026-06-01&to=2026-06-30',
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
