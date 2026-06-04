import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourceRoot = new URL('../src/', import.meta.url);
const outputDir = join(tmpdir(), 'devnote-popular-post-tests', `${Date.now()}`);

async function transpileSource(relativePath) {
  const sourcePath = new URL(relativePath, sourceRoot);
  const source = await readFile(sourcePath, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      verbatimModuleSyntax: true,
    },
  });

  const outputPath = join(outputDir, relativePath).replace(/\.ts$/, '.mjs');
  await mkdir(dirname(outputPath), { recursive: true });
  const output = transpiled.outputText
    .replace(/\.ts'/g, ".mjs'")
    .replace("from './postMetadata';", "from './postMetadata.mjs';");

  await writeFile(outputPath, output, 'utf8');
}

await transpileSource('utils/postMetadata.ts');
await transpileSource('utils/popularPosts.ts');

const { buildPopularPosts } = await import(pathToFileURL(join(outputDir, 'utils/popularPosts.mjs')).href);

const posts = [
  {
    id: 1,
    slug: 'older-high',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Older high',
    excerpt: '',
    displayDate: '2026.05.01',
    readTime: '3 min',
    viewCount: 300,
    tags: [],
    imageStyle: 'laptop',
  },
  {
    id: 2,
    slug: 'latest-tie',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Latest tie',
    excerpt: '',
    displayDate: '2026.05.03',
    readTime: '3 min',
    viewCount: 200,
    tags: [],
    imageStyle: 'laptop',
  },
  {
    id: 3,
    slug: 'older-tie',
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
    title: 'Older tie',
    excerpt: '',
    displayDate: '2026.05.02',
    readTime: '3 min',
    viewCount: 200,
    tags: [],
    imageStyle: 'laptop',
  },
  {
    id: 4,
    slug: 'ai-top',
    category: 'AI',
    categorySlug: 'ai-automation',
    title: 'AI top',
    excerpt: '',
    displayDate: '2026.05.04',
    readTime: '3 min',
    viewCount: 1000,
    tags: [],
    imageStyle: 'ai',
  },
];

assert.deepEqual(buildPopularPosts(posts, { limit: 3 }).map((post) => post.slug), [
  'ai-top',
  'older-high',
  'latest-tie',
]);

assert.deepEqual(buildPopularPosts(posts, { categorySlug: 'spring-boot', limit: 2 }), [
  {
    rank: 1,
    title: 'Older high',
    views: '300',
    slug: 'older-high',
    categorySlug: 'spring-boot',
  },
  {
    rank: 2,
    title: 'Latest tie',
    views: '200',
    slug: 'latest-tie',
    categorySlug: 'spring-boot',
  },
]);
