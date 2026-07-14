import type { BlogPost, PostCreateRequest } from '../../types';

export const thumbnailOptions: Array<{ value: BlogPost['imageStyle']; label: string }> = [
  { value: 'ai', label: 'AI' },
  { value: 'laptop', label: 'Laptop' },
  { value: 'docker', label: 'Docker' },
  { value: 'code', label: 'Code' },
  { value: 'chart', label: 'Chart' },
  { value: 'security', label: 'Security' },
  { value: 'data', label: 'Data' },
  { value: 'monitor', label: 'Monitor' },
];

export const initialDraft: PostCreateRequest = {
  slug: '',
  categoryId: 0,
  title: '',
  excerpt: '',
  readTime: '',
  thumbnailStyle: 'laptop',
  contentMarkdown: '',
  tags: [],
};

export function createNormalizedPostRequest(
  draft: PostCreateRequest,
  tagText: string,
): PostCreateRequest {
  return {
    ...draft,
    slug: draft.slug.trim(),
    title: draft.title.trim(),
    excerpt: draft.excerpt.trim(),
    readTime: draft.readTime.trim(),
    contentMarkdown: draft.contentMarkdown.trim(),
    tags: parseTags(tagText),
  };
}

export function isPostRequestComplete(request: PostCreateRequest) {
  return Boolean(
    request.slug &&
      request.categoryId &&
      request.title &&
      request.excerpt &&
      request.contentMarkdown,
  );
}

export function parseTags(value: string) {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export function createSlug(title: string, fallback: string) {
  const source = `${title} ${fallback}`;
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || `ai-post-${Date.now()}`;
}
