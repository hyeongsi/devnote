import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/features/admin/adminPostManagement.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const sidebarSource = await readFile(
  new URL('../src/features/admin/AdminSidebar.tsx', import.meta.url),
  'utf8',
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-admin-post-management-tests');
const outputPath = join(outputDir, `admin-post-management-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const { filterAndSortAdminPosts } = await import(pathToFileURL(outputPath).href);

const posts = [
  {
    id: 1,
    slug: 'older-popular',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Security guide',
    excerpt: 'JWT authentication',
    displayDate: '2026.06.01',
    readTime: '5분 읽기',
    viewCount: 500,
    tags: ['JWT'],
    imageStyle: 'security',
  },
  {
    id: 2,
    slug: 'latest-java',
    category: 'Java',
    categorySlug: 'java',
    title: 'Java records',
    excerpt: 'Record classes',
    displayDate: '2026.06.08',
    readTime: '4분 읽기',
    viewCount: 100,
    tags: ['Java 21'],
    imageStyle: 'code',
  },
  {
    id: 3,
    slug: 'spring-data',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Spring Data tips',
    excerpt: 'Repository patterns',
    displayDate: '2026.06.05',
    readTime: '6분 읽기',
    viewCount: 300,
    tags: ['JPA'],
    imageStyle: 'data',
  },
];

assert.deepEqual(
  filterAndSortAdminPosts(posts, {
    query: 'jwt',
    categorySlug: 'all',
    sortBy: 'latest',
  }).map((post) => post.id),
  [1],
);

assert.deepEqual(
  filterAndSortAdminPosts(posts, {
    query: '',
    categorySlug: 'spring-boot',
    sortBy: 'latest',
  }).map((post) => post.id),
  [3, 1],
);

assert.deepEqual(
  filterAndSortAdminPosts(posts, {
    query: '',
    categorySlug: 'all',
    sortBy: 'views',
  }).map((post) => post.id),
  [1, 3, 2],
);

assert.match(appSource, /path="posts" element={<AdminPostsPage \/>}/);
assert.match(sidebarSource, /게시글 관리', to: '\/admin\/posts'/);
