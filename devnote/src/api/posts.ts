import type {
  BlogPost,
  BlogPostApiResponse,
  BlogPostDetail,
  BlogPostDetailApiResponse,
  PostCreateRequest,
} from '../types';

const POSTS_API_URL = 'http://localhost:8080/api/posts';

export async function getPosts(): Promise<BlogPost[]> {
  const response = await fetch(POSTS_API_URL);

  if (!response.ok) {
    throw new Error(`게시글 목록을 불러오지 못했습니다. (${response.status})`);
  }

  const posts = (await response.json()) as BlogPostApiResponse[];
  return posts.map(mapPostResponse);
}

export async function getPost(categorySlug: string, postSlug: string): Promise<BlogPostDetail> {
  const response = await fetch(`${POSTS_API_URL}/${categorySlug}/${postSlug}`);

  if (response.status === 404) {
    throw new Error('POST_NOT_FOUND');
  }

  if (!response.ok) {
    throw new Error(`게시글 상세를 불러오지 못했습니다. (${response.status})`);
  }

  const post = (await response.json()) as BlogPostDetailApiResponse;
  return {
    ...mapPostResponse(post),
    contentMarkdown: post.contentMarkdown,
  };
}

export async function createPost(request: PostCreateRequest): Promise<BlogPostDetail> {
  const response = await fetch(POSTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(request),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('FORBIDDEN');
  }

  if (response.status === 409) {
    throw new Error('SLUG_CONFLICT');
  }

  if (!response.ok) {
    throw new Error(`게시글을 저장하지 못했습니다. (${response.status})`);
  }

  const post = (await response.json()) as BlogPostDetailApiResponse;
  return {
    ...mapPostResponse(post),
    contentMarkdown: post.contentMarkdown,
  };
}

export async function deletePost(categorySlug: string, postSlug: string): Promise<void> {
  const response = await fetch(`${POSTS_API_URL}/${categorySlug}/${postSlug}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('FORBIDDEN');
  }

  if (response.status === 404) {
    throw new Error('POST_NOT_FOUND');
  }

  if (!response.ok) {
    throw new Error(`게시글을 삭제하지 못했습니다. (${response.status})`);
  }
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
