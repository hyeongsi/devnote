import type { BlogPost } from '../types';

export function buildAboutStats(posts: BlogPost[]) {
  return {
    postCount: posts.length,
    categoryCount: new Set(posts.map((post) => post.categorySlug)).size,
    totalViewCount: posts.reduce((total, post) => total + post.viewCount, 0),
  };
}

export function buildHomeContent(posts: BlogPost[]) {
  const latestPosts = [...posts]
    .sort(
      (left, right) =>
        right.displayDate.localeCompare(left.displayDate) || right.id - left.id,
    )
    .slice(0, 4);
  const popularPosts = [...posts]
    .sort(
      (left, right) =>
        right.viewCount - left.viewCount ||
        right.displayDate.localeCompare(left.displayDate) ||
        right.id - left.id,
    )
    .slice(0, 3);
  const categoryMap = new Map<string, { slug: string; name: string; count: number }>();

  posts.forEach((post) => {
    const category = categoryMap.get(post.categorySlug);

    if (category) {
      category.count += 1;
      return;
    }

    categoryMap.set(post.categorySlug, {
      slug: post.categorySlug,
      name: post.category,
      count: 1,
    });
  });

  const categories = [...categoryMap.values()]
    .sort(
      (left, right) =>
        right.count - left.count || left.name.localeCompare(right.name, 'ko'),
    )
    .slice(0, 6);

  return { latestPosts, popularPosts, categories };
}
