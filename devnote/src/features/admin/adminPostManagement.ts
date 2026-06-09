import type { BlogPost } from '../../types';

export type AdminPostSort = 'latest' | 'views';

interface AdminPostFilters {
  query: string;
  categorySlug: string;
  sortBy: AdminPostSort;
}

export function filterAndSortAdminPosts(
  posts: BlogPost[],
  { query, categorySlug, sortBy }: AdminPostFilters,
) {
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPosts = posts.filter((post) => {
    const matchesCategory =
      categorySlug === 'all' || post.categorySlug === categorySlug;
    const searchableText = [
      post.title,
      post.excerpt,
      post.category,
      post.slug,
      ...post.tags,
    ]
      .join(' ')
      .toLowerCase();

    return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
  });

  return [...filteredPosts].sort((first, second) => {
    if (sortBy === 'views') {
      return second.viewCount - first.viewCount || second.id - first.id;
    }

    return (
      getDateWeight(second.displayDate) - getDateWeight(first.displayDate) ||
      second.id - first.id
    );
  });
}

function getDateWeight(displayDate: string) {
  return Number(displayDate.replace(/\D/g, '')) || 0;
}
