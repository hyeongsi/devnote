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

const postResponse = {
  id: 10,
  slug: 'spring-security-practical-guide',
  categoryName: 'Spring Boot',
  categorySlug: 'spring-boot',
  title: 'Spring Security practical guide',
  excerpt: 'A practical guide to Spring Security.',
  displayDate: '2026.05.20',
  readTime: '8 min read',
  viewCount: 0,
  tags: ['Spring Security', 'Auth'],
  thumbnailStyle: 'laptop',
  contentMarkdown: '## Spring Security\n\nSecuring requests.',
  matchedText: 'Spring Security match in content',
};

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  const isSearch = String(url).includes('/search?query=');
  return {
    ok: true,
    status: options?.method === 'POST' ? 201 : 204,
    json: async () => (isSearch ? [postResponse] : postResponse),
  };
};

const { createPost, deletePost, searchPosts } = await import(pathToFileURL(outputPath).href);

const savedPost = await createPost({
  slug: 'spring-security-practical-guide',
  categoryId: 1,
  title: 'Spring Security practical guide',
  excerpt: 'A practical guide to Spring Security.',
  readTime: '8 min read',
  thumbnailStyle: 'laptop',
  contentMarkdown: '## Spring Security\n\nSecuring requests.',
  tags: ['Spring Security', 'Auth'],
});

await deletePost('spring-boot', 'delete-me');

const searchResults = await searchPosts('spring security');

assert.equal(savedPost.slug, 'spring-security-practical-guide');
assert.equal(searchResults[0].slug, 'spring-security-practical-guide');
assert.equal(searchResults[0].category, 'Spring Boot');
assert.equal(searchResults[0].matchedText, 'Spring Security match in content');
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
        title: 'Spring Security practical guide',
        excerpt: 'A practical guide to Spring Security.',
        readTime: '8 min read',
        thumbnailStyle: 'laptop',
        contentMarkdown: '## Spring Security\n\nSecuring requests.',
        tags: ['Spring Security', 'Auth'],
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
  {
    url: 'http://localhost:8080/api/posts/search?query=spring%20security',
    options: undefined,
  },
]);
