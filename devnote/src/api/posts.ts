import type {
  BlogPost,
  BlogPostApiResponse,
  BlogPostDetail,
  BlogPostDetailApiResponse,
  BlogPostSearchApiResponse,
  BlogPostSearchResult,
  PostCreateRequest,
} from '../types';
import { fetchAdmin } from './adminAuth';
import { apiRequest } from './http';

const POSTS_API_URL = '/api/posts';

export async function getPosts(): Promise<BlogPost[]> {
  const posts = await apiRequest<BlogPostApiResponse[]>(POSTS_API_URL, {
    errorMessage: '게시글 목록을 불러오지 못했습니다.',
  });
  return posts.map(mapPostResponse);
}

export async function getPost(categorySlug: string, postSlug: string): Promise<BlogPostDetail> {
  const post = await apiRequest<BlogPostDetailApiResponse>(
    `${POSTS_API_URL}/${categorySlug}/${postSlug}`,
    {
      statusMessages: {
        404: 'POST_NOT_FOUND',
      },
      errorMessage: '게시글 상세를 불러오지 못했습니다.',
    },
  );
  return {
    ...mapPostResponse(post),
    contentMarkdown: post.contentMarkdown,
  };
}

export async function searchPosts(query: string): Promise<BlogPostSearchResult[]> {
  const posts = await apiRequest<BlogPostSearchApiResponse[]>(
    `${POSTS_API_URL}/search?query=${encodeURIComponent(query)}`,
    {
      errorMessage: '게시글 검색 결과를 불러오지 못했습니다.',
    },
  );
  return posts.map(mapPostSearchResponse);
}

export async function createPost(request: PostCreateRequest): Promise<BlogPostDetail> {
  const post = await apiRequest<BlogPostDetailApiResponse, PostCreateRequest>(POSTS_API_URL, {
    method: 'POST',
    request: fetchAdmin,
    body: request,
    statusMessages: {
      409: 'SLUG_CONFLICT',
    },
    errorMessage: '게시글을 저장하지 못했습니다.',
  });
  return {
    ...mapPostResponse(post),
    contentMarkdown: post.contentMarkdown,
  };
}

export async function deletePost(categorySlug: string, postSlug: string): Promise<void> {
  await apiRequest<void>(`${POSTS_API_URL}/${categorySlug}/${postSlug}`, {
    method: 'DELETE',
    request: fetchAdmin,
    statusMessages: {
      404: 'POST_NOT_FOUND',
    },
    errorMessage: '게시글을 삭제하지 못했습니다.',
  });
}

function mapPostResponse(post: BlogPostApiResponse): BlogPost {
  return {
    id: post.id,
    slug: post.slug,
    category: post.categoryName,
    categorySlug: post.categorySlug,
    title: post.title,
    excerpt: post.excerpt,
    displayDate: post.displayDate,
    readTime: post.readTime,
    viewCount: post.viewCount,
    tags: post.tags,
    imageStyle: post.thumbnailStyle,
  };
}

function mapPostSearchResponse(post: BlogPostSearchApiResponse): BlogPostSearchResult {
  return {
    id: post.id,
    slug: post.slug,
    category: post.categoryName,
    categorySlug: post.categorySlug,
    title: post.title,
    excerpt: post.excerpt,
    displayDate: post.displayDate,
    matchedText: post.matchedText,
  };
}
