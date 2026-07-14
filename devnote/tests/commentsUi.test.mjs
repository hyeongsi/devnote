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
assert.match(detailSource, /aria-expanded={isCommentPanelOpen}/);
assert.match(detailSource, /onClick={handleToggleComments}/);
assert.match(detailSource, /<span>{commentCount}<\/span>/);
assert.match(detailSource, /id="post-comments"/);
assert.match(detailSource, /hidden={!isCommentPanelOpen}/);
assert.match(detailSource, /canManageComments={isAdmin}/);
assert.match(detailSource, /onCommentCountChange={setCommentCount}/);
assert.match(commentsSource, /createPostComment/);
assert.match(commentsSource, /deletePostComment/);
assert.match(commentsSource, /onCommentCountChange\?\.\(comments\.length\)/);
assert.match(commentsSource, /canManageComments \? \(/);
assert.match(commentsSource, /삭제용 비밀번호/);
