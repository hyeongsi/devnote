import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const source = await readFile(new URL('../src/api/aiAutoPosting.ts', import.meta.url), 'utf8');
const adminAuthSource = await readFile(new URL('../src/api/adminAuth.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});
const adminAuthTranspiled = ts.transpileModule(adminAuthSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});
const outputDir = join(tmpdir(), 'devnote-ai-post-draft-tests');
const outputPath = join(outputDir, `ai-post-drafts-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'adminAuth'), adminAuthTranspiled.outputText, 'utf8');
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: options?.method === 'POST' ? 201 : 200,
    headers: { get: () => null },
    json: async () => ({ id: 41, topic: 'Spring Security' }),
  };
};

const { getAiPostingDraft, publishAiPostingDraft } = await import(pathToFileURL(outputPath).href);
const post = {
  slug: 'spring-security',
  categoryId: 1,
  title: 'Spring Security',
  excerpt: 'summary',
  readTime: '8 min',
  thumbnailStyle: 'laptop',
  contentMarkdown: '## content',
  tags: ['Security'],
};

await getAiPostingDraft(41);
await publishAiPostingDraft(41, post);

assert.deepEqual(calls, [
  {
    url: '/api/admin/ai-posting/drafts/41',
    options: {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    },
  },
  {
    url: '/api/admin/ai-posting/drafts/41/publish',
    options: {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ post }),
      headers: { 'Content-Type': 'application/json' },
    },
  },
]);
