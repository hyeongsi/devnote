import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { transpileApiModule } from './transpileApiModule.mjs';

const outputPath = await transpileApiModule(new URL('../src/api/dashboard.ts', import.meta.url), 'dashboard');

const calls = [];
globalThis.fetch = async (url, options) => {
  calls.push({ url, options });

  if (String(url).endsWith('/traffic')) {
    return {
      ok: true,
      status: 200,
      json: async () => [
        { date: '2026-06-07', value: 3 },
        { date: '2026-06-08', value: 5 },
      ],
    };
  }

  if (String(url).endsWith('/activities')) {
    return {
      ok: true,
      status: 200,
      json: async () => [
        {
          type: 'COMMENT_CREATED',
          id: 'comment-1',
          description: 'Commented post',
          occurredAt: '2026-06-08T11:00:00',
        },
      ],
    };
  }

  return {
    ok: true,
    status: 200,
    json: async () => ({
      totalPosts: 12,
      totalViews: 3456,
      totalLikes: 87,
      totalComments: 23,
      newSubscribers: 5,
    }),
  };
};

const { getDashboardStats, getDashboardTraffic, getDashboardActivities } = await import(
  pathToFileURL(outputPath).href
);
const stats = await getDashboardStats();
const traffic = await getDashboardTraffic();
const activities = await getDashboardActivities();

assert.deepEqual(stats, {
  totalPosts: 12,
  totalViews: 3456,
  totalLikes: 87,
  totalComments: 23,
  newSubscribers: 5,
});
assert.deepEqual(traffic, [
  { date: '2026-06-07', value: 3 },
  { date: '2026-06-08', value: 5 },
]);
assert.deepEqual(activities, [
  {
    type: 'COMMENT_CREATED',
    id: 'comment-1',
    description: 'Commented post',
    occurredAt: '2026-06-08T11:00:00',
  },
]);
assert.deepEqual(calls, [
  {
    url: '/api/admin/dashboard/stats',
    options: {
      credentials: 'include',
    },
  },
  {
    url: '/api/admin/dashboard/traffic',
    options: {
      credentials: 'include',
    },
  },
  {
    url: '/api/admin/dashboard/activities',
    options: {
      credentials: 'include',
    },
  },
]);
