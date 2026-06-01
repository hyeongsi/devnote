import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/aiPosts.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-ai-post-tests');
const outputPath = join(outputDir, `ai-posts-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => ({
      title: 'Spring Security를 실무 관점에서 이해하기',
      summary: 'Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.',
      content: '## Spring Security란?\n\n본문입니다.',
      tags: ['Spring Security', 'Spring Boot'],
      readTime: '8분 읽기',
      recommendedTopics: ['JWT 인증 방식'],
      recommendedCategorySlug: 'spring-boot',
      thumbnailStyle: 'laptop',
    }),
  };
};

const { generateAiPost } = await import(pathToFileURL(outputPath).href);

const response = await generateAiPost({ topic: 'Spring Security' });

assert.equal(response.recommendedCategorySlug, 'spring-boot');
assert.deepEqual(calls, [
  {
    url: 'http://localhost:8080/api/ai/posts/generate',
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
