import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/api/posts.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-post-tests');
const outputPath = join(outputDir, `posts-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: options?.method === 'POST' ? 201 : 204,
    json: async () => ({
      id: 10,
      slug: 'spring-security-practical-guide',
      categoryName: 'Spring Boot',
      categorySlug: 'spring-boot',
      title: 'Spring Security를 실무 관점에서 이해하기',
      excerpt: 'Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.',
      displayDate: '2026.05.20',
      readTime: '8분 읽기',
      viewCount: 0,
      tags: ['Spring Security', '인증'],
      thumbnailStyle: 'laptop',
      contentMarkdown: '## Spring Security란?\n\n본문입니다.',
    }),
  };
};

const { createPost, deletePost } = await import(pathToFileURL(outputPath).href);

const savedPost = await createPost({
  slug: 'spring-security-practical-guide',
  categoryId: 1,
  title: 'Spring Security를 실무 관점에서 이해하기',
  excerpt: 'Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.',
  readTime: '8분 읽기',
  thumbnailStyle: 'laptop',
  contentMarkdown: '## Spring Security란?\n\n본문입니다.',
  tags: ['Spring Security', '인증'],
});

await deletePost('spring-boot', 'delete-me');

assert.equal(savedPost.slug, 'spring-security-practical-guide');
assert.deepEqual(calls, [
  {
    url: 'http://localhost:8080/api/posts',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        slug: 'spring-security-practical-guide',
        categoryId: 1,
        title: 'Spring Security를 실무 관점에서 이해하기',
        excerpt: 'Spring Security의 핵심 개념과 실무 활용 방식을 정리합니다.',
        readTime: '8분 읽기',
        thumbnailStyle: 'laptop',
        contentMarkdown: '## Spring Security란?\n\n본문입니다.',
        tags: ['Spring Security', '인증'],
      }),
    },
  },
  {
    url: 'http://localhost:8080/api/posts/spring-boot/delete-me',
    options: {
      method: 'DELETE',
      credentials: 'include',
    },
  },
]);
