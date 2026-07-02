import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/adminAuth.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-admin-auth-tests');
const outputPath = join(outputDir, `admin-auth-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const events = [];
globalThis.window = {
  dispatchEvent(event) {
    events.push(event.type);
  },
};

let fetchMode = 'ok';
globalThis.fetch = async () => {
  if (fetchMode === 'unauthorized') {
    return {
      ok: false,
      status: 401,
    };
  }

  if (fetchMode === 'network-error') {
    throw new TypeError('Failed to fetch');
  }

  return {
    ok: true,
    status: 200,
  };
};

const {
  AUTH_REQUIRED_ERROR,
  AUTH_REQUIRED_EVENT,
  buildLoginRedirectPath,
  fetchAdmin,
} = await import(pathToFileURL(outputPath).href);

assert.equal(
  buildLoginRedirectPath('/admin/error-logs', '?status=503', '#detail'),
  '/login?redirect=%2Fadmin%2Ferror-logs%3Fstatus%3D503%23detail',
);

fetchMode = 'unauthorized';
await assert.rejects(() => fetchAdmin('/api/admin/dashboard'), {
  message: AUTH_REQUIRED_ERROR,
});

fetchMode = 'network-error';
await assert.rejects(() => fetchAdmin('/api/admin/dashboard'), {
  message: AUTH_REQUIRED_ERROR,
});

assert.deepEqual(events, [AUTH_REQUIRED_EVENT, AUTH_REQUIRED_EVENT]);
