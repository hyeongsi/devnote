import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(new URL('../src/api/aiPosts.ts', import.meta.url), 'ai-posts');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  return {
    ok: true,
    status: 200,
    json: async () => ({
      draftId: 41,
      result: {
        title: 'Spring Security guide',
        summary: 'Spring Security summary',
        content: '## Spring Security',
        tags: ['Spring Security', 'Spring Boot'],
        readTime: '8 min',
        recommendedTopics: ['JWT'],
        recommendedCategorySlug: 'spring-boot',
        thumbnailStyle: 'laptop',
      },
    }),
  };
};

const { generateAiPost } = await import(pathToFileURL(outputPath).href);

const response = await generateAiPost({ topic: 'Spring Security' });

assert.equal(response.draftId, 41);
assert.equal(response.result.recommendedCategorySlug, 'spring-boot');
assert.deepEqual(calls, [
  {
    url: '/api/ai/posts/generate',
    options: {
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify({ topic: 'Spring Security' }),
      headers: {
        'Content-Type': 'application/json',
      },
    },
  },
]);
