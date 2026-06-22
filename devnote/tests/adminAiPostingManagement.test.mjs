import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pageSource = await readFile(
  new URL('../src/pages/admin/AdminAiPostingPage.tsx', import.meta.url),
  'utf8',
);
const apiSource = await readFile(
  new URL('../src/api/aiAutoPosting.ts', import.meta.url),
  'utf8',
);

assert.match(pageSource, /매일 오전 6시 자동 게시/);
assert.match(pageSource, /다음 주제/);
assert.match(pageSource, /주제 추가/);
assert.match(pageSource, /최근 자동 게시/);
assert.match(pageSource, /지금 실행/);
assert.match(pageSource, /activeDraftId/);
assert.match(pageSource, /getAiPostingDraft/);
assert.match(pageSource, /publishAiPostingDraft/);
assert.match(pageSource, /run\.loadable/);
assert.match(pageSource, /run\.topic/);
assert.match(apiSource, /\/status/);
assert.match(apiSource, /\/topics/);
assert.match(apiSource, /\/runs/);
assert.match(apiSource, /\/run/);
assert.match(apiSource, /\/drafts\/\$\{id\}/);
assert.match(apiSource, /\/drafts\/\$\{id\}\/publish/);
