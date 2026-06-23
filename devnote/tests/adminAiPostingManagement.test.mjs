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
assert.match(pageSource, /function showSaveValidationError\(description: string\)/);
assert.match(pageSource, /title: '게시글 저장 정보를 확인해 주세요\.'/);
assert.match(pageSource, /showSaveValidationError\('제목, 요약, 본문, slug, 카테고리는 반드시 입력해야 합니다\.'\)/);
assert.match(pageSource, /showSaveValidationError\('태그를 하나 이상 입력해 주세요\.'\)/);
assert.match(apiSource, /\/status/);
assert.match(apiSource, /\/topics/);
assert.match(apiSource, /\/runs/);
assert.match(apiSource, /\/run/);
assert.match(apiSource, /\/drafts\/\$\{id\}/);
assert.match(apiSource, /\/drafts\/\$\{id\}\/publish/);
