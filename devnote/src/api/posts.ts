import type { BlogPost, BlogPostApiResponse } from '../types';

const POSTS_API_URL = 'http://localhost:8080/api/posts';

export async function getPosts(): Promise<BlogPost[]> {
  const response = await fetch(POSTS_API_URL);

  if (!response.ok) {
    throw new Error(`게시글 목록을 불러오지 못했습니다. (${response.status})`);
  }

  const posts = (await response.json()) as BlogPostApiResponse[];
  return posts.map(mapPostResponse);
}

function mapPostResponse(post: BlogPostApiResponse): BlogPost {
  return {
    id: post.id,
    slug: post.slug,
    category: post.categoryName,
    categorySlug: post.categorySlug,
    title: post.title,
    excerpt: post.excerpt,
    date: post.displayDate,
    readTime: post.readTime,
    views: formatViewCount(post.viewCount),
    tags: post.tags,
    imageStyle: post.thumbnailStyle,
  };
}

function formatViewCount(viewCount: number): string {
  if (viewCount >= 1000) {
    return `${(viewCount / 1000).toFixed(1)}K`;
  }

  return `${viewCount}`;
}
