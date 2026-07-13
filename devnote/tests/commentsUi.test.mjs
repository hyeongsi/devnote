import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const appSource = await readFile(new URL('../src/App.tsx', import.meta.url), 'utf8');
const sidebarSource = await readFile(
  new URL('../src/features/admin/AdminSidebar.tsx', import.meta.url),
  'utf8',
);
const detailSource = await readFile(new URL('../src/pages/PostDetailPage.tsx', import.meta.url), 'utf8');
const commentsSource = await readFile(
  new URL('../src/features/post/PostComments.tsx', import.meta.url),
  'utf8',
);

assert.match(appSource, /path="comments" element={<AdminCommentsPage \/>}/);
assert.match(sidebarSource, /댓글 관리', to: '\/admin\/comments'/);
assert.match(detailSource, /<PostComments categorySlug={post\.categorySlug} postSlug={post\.slug} \/>/);
assert.match(commentsSource, /createPostComment/);
assert.match(commentsSource, /deletePostComment/);
assert.match(commentsSource, /삭제용 비밀번호/);
