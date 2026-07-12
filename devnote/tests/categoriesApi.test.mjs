import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(new URL('../src/api/categories.ts', import.meta.url), 'categories');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });

  if (options?.method === 'PUT') {
    return {
      ok: true,
      status: 204,
      json: async () => ({}),
    };
  }

  return {
    ok: true,
    status: 200,
    json: async () => [
      {
        id: 2,
        slug: 'java',
        name: 'Java',
        description: 'Java posts',
        count: 4,
        visible: true,
        displayOrder: 3,
      },
      {
        id: 1,
        slug: 'spring-boot',
        name: 'Spring Boot',
        description: 'Spring posts',
        count: 8,
        visible: true,
        displayOrder: 1,
      },
      {
        id: 3,
        slug: 'devops',
        name: 'DevOps',
        description: 'DevOps posts',
        count: 2,
        visible: true,
        displayOrder: 2,
      },
    ],
  };
};

const { getBlogCategories, saveAdminCategories } = await import(pathToFileURL(outputPath).href);

const categories = await getBlogCategories();

assert.deepEqual(
  categories.map((category) => category.slug),
  ['spring-boot', 'devops', 'java'],
);

await saveAdminCategories([
  { id: 3, slug: 'devops', name: 'DevOps', description: 'DevOps posts', postCount: 2, visible: true, order: 3 },
  { id: 1, slug: 'spring-boot', name: 'Spring Boot', description: 'Spring posts', postCount: 8, visible: true, order: 1 },
  { id: 2, slug: 'java', name: 'Java', description: 'Java posts', postCount: 4, visible: true, order: 2 },
]);

assert.deepEqual(JSON.parse(calls[1].options.body).map((item) => ({ id: item.id, displayOrder: item.displayOrder })), [
  { id: 3, displayOrder: 1 },
  { id: 1, displayOrder: 2 },
  { id: 2, displayOrder: 3 },
]);
