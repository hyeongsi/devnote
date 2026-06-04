import type { BlogPost, RankedPost } from '../types';
import { formatViewCount } from './postMetadata';

interface BuildPopularPostsOptions {
  categorySlug?: string;
  limit?: number;
}

const DEFAULT_POPULAR_POST_LIMIT = 5;

export function buildPopularPosts(
  posts: BlogPost[],
  { categorySlug, limit = DEFAULT_POPULAR_POST_LIMIT }: BuildPopularPostsOptions = {},
): RankedPost[] {
  const scopedPosts =
    categorySlug && categorySlug !== 'all'
      ? posts.filter((post) => post.categorySlug === categorySlug)
      : posts;

  return [...scopedPosts]
    .sort(comparePopularPosts)
    .slice(0, limit)
    .map((post, index) => ({
      rank: index + 1,
      title: post.title,
      views: formatViewCount(post.viewCount),
      slug: post.slug,
      categorySlug: post.categorySlug,
    }));
}

function comparePopularPosts(first: BlogPost, second: BlogPost) {
  return (
    second.viewCount - first.viewCount ||
    getDisplayDateWeight(second.displayDate) - getDisplayDateWeight(first.displayDate) ||
    second.id - first.id
  );
}

function getDisplayDateWeight(displayDate: string) {
  return Number(displayDate.replace(/\D/g, '')) || 0;
}
