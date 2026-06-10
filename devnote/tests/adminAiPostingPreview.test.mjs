import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageSource = await readFile(
  new URL('../src/pages/admin/AdminAiPostingPage.tsx', import.meta.url),
  'utf8',
);

assert.match(
  pageSource,
  /<article[\s\S]*?className="[^"]*max-h-\[65vh\][^"]*overflow-y-auto[^"]*xl:max-h-\[720px\][^"]*"/,
);
assert.match(pageSource, /aria-label="생성 결과 미리보기"/);
