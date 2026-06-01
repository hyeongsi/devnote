import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/components/auth/adminAccess.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-admin-access-tests');
const outputPath = join(outputDir, `admin-access-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const { isAdminUser } = await import(pathToFileURL(outputPath).href);

assert.equal(isAdminUser({ email: 'admin@devnote.dev', role: 'ROLE_ADMIN' }), true);
assert.equal(isAdminUser({ email: 'user@devnote.dev', role: 'ROLE_USER' }), false);
assert.equal(isAdminUser(null), false);
