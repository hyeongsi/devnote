import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const sourcePath = new URL('../src/features/homeContent.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const homeSource = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8');
const heroSource = await readFile(new URL('../src/features/HomeHero.tsx', import.meta.url), 'utf8');
const headerSource = await readFile(
  new URL('../src/components/layout/Header.tsx', import.meta.url),
  'utf8',
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-home-content-tests');
const outputPath = join(outputDir, `home-content-${Date.now()}.mjs`);
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, transpiled.outputText, 'utf8');

const { buildAboutStats, buildHomeContent } = await import(pathToFileURL(outputPath).href);
const posts = [
  {
    id: 1,
    displayDate: '2026.06.01',
    viewCount: 900,
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
  },
  {
    id: 2,
    displayDate: '2026.06.09',
    viewCount: 300,
    category: 'Java',
    categorySlug: 'java',
  },
  {
    id: 3,
    displayDate: '2026.06.05',
    viewCount: 1500,
    category: 'Spring Boot',
    categorySlug: 'spring-boot',
  },
];

const content = buildHomeContent(posts);

assert.deepEqual(content.latestPosts.map((post) => post.id), [2, 3, 1]);
assert.deepEqual(content.popularPosts.map((post) => post.id), [3, 1, 2]);
assert.deepEqual(content.categories, [
  { slug: 'spring-boot', name: 'Spring Boot', count: 2 },
  { slug: 'java', name: 'Java', count: 1 },
]);
assert.deepEqual(buildAboutStats(posts), {
  postCount: 3,
  categoryCount: 2,
  totalViewCount: 2700,
});
assert.doesNotMatch(homeSource, /주요 프로젝트|기술 스택|featuredProjects|stackItems/);
assert.doesNotMatch(homeSource, /PostPreviewCard/);
assert.match(homeSource, /인기 게시글/);
assert.match(homeSource, /카테고리별 글 탐색/);
assert.match(homeSource, /lg:grid-cols-\[112px_minmax\(0,1fr\)_120px\]/);
assert.match(homeSource, /xl:grid-cols-6/);
assert.match(homeSource, /aria-label=\{`\$\{index \+ 1\}위`\}/);
assert.match(homeSource, /rotate-\[-28deg\]/);
assert.match(homeSource, /min-h-\[190px\]/);
assert.doesNotMatch(heroSource, /포트폴리오 보기/);
assert.match(heroSource, /인기 글 보기/);
assert.match(heroSource, /자동 포스팅 대시보드/);
assert.match(heroSource, /최근 발행 글/);
assert.match(heroSource, /bg-\[#eef0f5\]/);
assert.doesNotMatch(headerSource, />\s*관리자\s*</);
assert.doesNotMatch(headerSource, /navigate\('\/admin'\)/);
assert.doesNotMatch(headerSource, /다크 모드|Moon/);
