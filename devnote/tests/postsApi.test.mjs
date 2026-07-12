import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(new URL('../src/api/posts.ts', import.meta.url), 'posts');

const postResponse = {
  id: 10,
  slug: 'spring-security-practical-guide',
  categoryName: 'Spring Boot',
  categorySlug: 'spring-boot',
  title: 'Spring Security practical guide',
  excerpt: 'A practical guide to Spring Security.',
  displayDate: '2026.05.20',
  readTime: '8 min read',
  viewCount: 0,
  tags: ['Spring Security', 'Auth'],
  thumbnailStyle: 'laptop',
  contentMarkdown: '## Spring Security\n\nSecuring requests.',
  matchedText: 'Spring Security match in content',
};

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });
  const isSearch = String(url).includes('/search?query=');
  return {
    ok: true,
    status: options?.method === 'POST' || isSearch ? 200 : 204,
    json: async () => (isSearch ? [postResponse] : postResponse),
  };
};

const { createPost, deletePost, searchPosts } = await import(pathToFileURL(outputPath).href);

const savedPost = await createPost({
  slug: 'spring-security-practical-guide',
  categoryId: 1,
  title: 'Spring Security practical guide',
  excerpt: 'A practical guide to Spring Security.',
  readTime: '8 min read',
  thumbnailStyle: 'laptop',
  contentMarkdown: '## Spring Security\n\nSecuring requests.',
  tags: ['Spring Security', 'Auth'],
});

await deletePost('spring-boot', 'delete-me');

const searchResults = await searchPosts('spring security');

assert.equal(savedPost.slug, 'spring-security-practical-guide');
assert.equal(searchResults[0].slug, 'spring-security-practical-guide');
assert.equal(searchResults[0].category, 'Spring Boot');
assert.equal(searchResults[0].matchedText, 'Spring Security match in content');
assert.deepEqual(calls, [
  {
    url: '/api/posts',
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        slug: 'spring-security-practical-guide',
        categoryId: 1,
        title: 'Spring Security practical guide',
        excerpt: 'A practical guide to Spring Security.',
        readTime: '8 min read',
        thumbnailStyle: 'laptop',
        contentMarkdown: '## Spring Security\n\nSecuring requests.',
        tags: ['Spring Security', 'Auth'],
      }),
    },
  },
  {
    url: '/api/posts/spring-boot/delete-me',
    options: {
      method: 'DELETE',
      credentials: 'include',
    },
  },
  {
    url: '/api/posts/search?query=spring%20security',
    options: undefined,
  },
]);
