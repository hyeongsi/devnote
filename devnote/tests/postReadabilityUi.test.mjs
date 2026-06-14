import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const detailSource = await readFile(
  new URL('../src/pages/PostDetailPage.tsx', import.meta.url),
  'utf8',
);
const rendererSource = await readFile(
  new URL('../src/features/post/PostMarkdownRenderer.tsx', import.meta.url),
  'utf8',
);
const globalStyles = await readFile(
  new URL('../src/index.css', import.meta.url),
  'utf8',
);

assert.match(detailSource, /minmax\(0,800px\)_260px/);
assert.match(detailSource, /lg:justify-center/);
assert.doesNotMatch(detailSource, /minmax\(120px,1fr\)/);
assert.match(detailSource, /activeHeadingId/);
assert.match(detailSource, /aria-label="게시글 목차"/);
assert.match(detailSource, /querySelectorAll<HTMLElement>\('h2\[id\], h3\[id\], h4\[id\]'\)/);
assert.match(detailSource, /findLast/);
assert.match(detailSource, /element\.offsetTop/);
assert.match(detailSource, /addEventListener\('scroll'/);
assert.match(detailSource, /data-testid="post-reading-grid"/);
assert.match(detailSource, /data-testid="post-navigation"/);
assert.match(detailSource, /lg:max-h-\[calc\(100vh-8rem\)\]/);
assert.match(detailSource, /lg:overflow-y-auto/);
assert.match(detailSource, /py-1\.5/);
assert.match(rendererSource, /코드 복사/);
assert.match(rendererSource, /navigator\.clipboard\.writeText/);
assert.match(rendererSource, /leading-\[1\.9\]/);
assert.match(globalStyles, /\.public-shell[\s\S]*overflow-x-clip/);
