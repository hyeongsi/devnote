import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const source = await readFile(new URL('../src/api/comments.ts', import.meta.url), 'utf8');
const adminAuthSource = await readFile(new URL('../src/api/adminAuth.ts', import.meta.url), 'utf8');
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});
const adminAuthTranspiled = ts.transpileModule(adminAuthSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
    verbatimModuleSyntax: true,
  },
});

const outputDir = join(tmpdir(), 'devnote-comment-tests', `${Date.now()}`);
const outputPath = join(outputDir, 'comments.mjs');
await mkdir(outputDir, { recursive: true });
await writeFile(join(outputDir, 'adminAuth'), adminAuthTranspiled.outputText, 'utf8');
await writeFile(outputPath, transpiled.outputText, 'utf8');

const commentResponse = {
  id: 7,
  authorName: 'visitor',
  content: 'Nice post',
  createdAt: '2026-07-13T10:00:00',
};
const calls = [];

globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: options?.method === 'POST' ? 201 : 200,
    json: async () => (String(url).includes('/api/admin/comments') ? [commentResponse] : commentResponse),
  };
};

const {
  createPostComment,
  deleteAdminComment,
  deletePostComment,
  getAdminComments,
  getPostComments,
} = await import(pathToFileURL(outputPath).href);

await getPostComments('spring-boot', 'comment-post');
await createPostComment('spring-boot', 'comment-post', {
  authorName: 'visitor',
  password: '1234',
  content: 'Nice post',
});
await deletePostComment('spring-boot', 'comment-post', 7, { password: '1234' });
await getAdminComments();
await deleteAdminComment(7);

assert.deepEqual(calls, [
  {
    url: '/api/posts/spring-boot/comment-post/comments',
    options: undefined,
  },
  {
    url: '/api/posts/spring-boot/comment-post/comments',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authorName: 'visitor',
        password: '1234',
        content: 'Nice post',
      }),
    },
  },
  {
    url: '/api/posts/spring-boot/comment-post/comments/7',
    options: {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: '1234' }),
    },
  },
  {
    url: '/api/admin/comments',
    options: {
      credentials: 'include',
    },
  },
  {
    url: '/api/admin/comments/7',
    options: {
      method: 'DELETE',
      credentials: 'include',
    },
  },
]);
