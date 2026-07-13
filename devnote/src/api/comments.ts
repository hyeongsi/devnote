import type {
  AdminComment,
  CommentCreateRequest,
  CommentDeleteRequest,
  PostComment,
} from '../types';
import { fetchAdmin } from './adminAuth';

const postsCommentUrl = (categorySlug: string, postSlug: string) =>
  `/api/posts/${categorySlug}/${postSlug}/comments`;

export async function getPostComments(
  categorySlug: string,
  postSlug: string,
): Promise<PostComment[]> {
  const response = await fetch(postsCommentUrl(categorySlug, postSlug));

  if (!response.ok) {
    throw new Error(`댓글을 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as PostComment[];
}

export async function createPostComment(
  categorySlug: string,
  postSlug: string,
  request: CommentCreateRequest,
): Promise<PostComment> {
  const response = await fetch(postsCommentUrl(categorySlug, postSlug), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`댓글을 등록하지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as PostComment;
}

export async function deletePostComment(
  categorySlug: string,
  postSlug: string,
  commentId: number,
  request: CommentDeleteRequest,
): Promise<void> {
  const response = await fetch(`${postsCommentUrl(categorySlug, postSlug)}/${commentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (response.status === 403) {
    throw new Error('댓글 비밀번호가 일치하지 않습니다.');
  }

  if (!response.ok) {
    throw new Error(`댓글을 삭제하지 못했습니다. (${response.status})`);
  }
}

export async function getAdminComments(): Promise<AdminComment[]> {
  const response = await fetchAdmin('/api/admin/comments');

  if (!response.ok) {
    throw new Error(`댓글 목록을 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as AdminComment[];
}

export async function deleteAdminComment(commentId: number): Promise<void> {
  const response = await fetchAdmin(`/api/admin/comments/${commentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`댓글을 삭제하지 못했습니다. (${response.status})`);
  }
}
