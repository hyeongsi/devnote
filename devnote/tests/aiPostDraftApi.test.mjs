import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(
  new URL('../src/api/aiAutoPosting.ts', import.meta.url),
  'ai-post-drafts',
);

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: options?.method === 'POST' ? 201 : 200,
    headers: { get: () => null },
    json: async () => ({ id: 41, topic: 'Spring Security' }),
  };
};

const { getAiPostingDraft, publishAiPostingDraft } = await import(pathToFileURL(outputPath).href);
const post = {
  slug: 'spring-security',
  categoryId: 1,
  title: 'Spring Security',
  excerpt: 'summary',
  readTime: '8 min',
  thumbnailStyle: 'laptop',
  contentMarkdown: '## content',
  tags: ['Security'],
};

await getAiPostingDraft(41);
await publishAiPostingDraft(41, post);

assert.deepEqual(calls, [
  {
    url: '/api/admin/ai-posting/drafts/41',
    options: {
      credentials: 'include',
    },
  },
  {
    url: '/api/admin/ai-posting/drafts/41/publish',
    options: {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ post }),
      headers: { 'Content-Type': 'application/json' },
    },
  },
]);
