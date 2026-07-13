import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(new URL('../src/api/auth.ts', import.meta.url), 'auth');

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
