import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/auth.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-auth-tests');
const outputPath = join(outputDir, `auth-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const events = [];
globalThis.window = {
  dispatchEvent(event) {
    events.push(event.type);
  },
};

globalThis.fetch = async (url, options) => {
  if (url.endsWith('/login')) {
    return {
      ok: true,
      status: 200,
      json: async () => ({ email: 'admin@devnote.dev', role: 'ROLE_ADMIN' }),
    };
  }

  if (url.endsWith('/logout')) {
    return {
      ok: true,
      status: 204,
    };
  }

  throw new Error(`Unexpected request: ${url} ${options?.method ?? 'GET'}`);
};

const { AUTH_CHANGED_EVENT, login, logout } = await import(pathToFileURL(outputPath).href);

await login({ email: 'admin@devnote.dev', password: 'devnote-admin-1234' });
await logout();

assert.deepEqual(events, [AUTH_CHANGED_EVENT, AUTH_CHANGED_EVENT]);
