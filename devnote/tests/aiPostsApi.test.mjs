import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/aiPosts.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
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

const outputDir = join(tmpdir(), 'devnote-ai-post-tests');
const outputPath = join(outputDir, `ai-posts-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'adminAuth'), adminAuthTranspiled.outputText, 'utf8');
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => ({
      draftId: 41,
      result: {
        title: 'Spring Security guide',
        summary: 'Spring Security summary',
        content: '## Spring Security',
        tags: ['Spring Security', 'Spring Boot'],
        readTime: '8 min',
        recommendedTopics: ['JWT'],
        recommendedCategorySlug: 'spring-boot',
        thumbnailStyle: 'laptop',
      },
    }),
  };
};

const { generateAiPost } = await import(pathToFileURL(outputPath).href);

const response = await generateAiPost({ topic: 'Spring Security' });

assert.equal(response.draftId, 41);
assert.equal(response.result.recommendedCategorySlug, 'spring-boot');
assert.deepEqual(calls, [
  {
    url: '/api/ai/posts/generate',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ topic: 'Spring Security' }),
    },
  },
]);
