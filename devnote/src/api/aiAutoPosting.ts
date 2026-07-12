import type {
  AiPostDraftDetail,
  AiPostingHistoryItem,
  AiPostingRun,
  AiPostingStatus,
  AiPostingTopic,
  BlogPostDetailApiResponse,
  PostCreateRequest,
} from '../types';
import { fetchAdmin } from './adminAuth';
import { apiRequest } from './http';

const AI_AUTO_POSTING_API_URL = '/api/admin/ai-posting';

function request<TResponse, TBody = unknown>(
  path: string,
  options: Omit<
    Parameters<typeof apiRequest<TResponse, TBody>>[1],
    'request' | 'withCredentials' | 'errorMessage'
  > = {},
) {
  return apiRequest<TResponse, TBody>(`${AI_AUTO_POSTING_API_URL}${path}`, {
    ...options,
    request: fetchAdmin,
    errorMessage: 'AI 자동 포스팅 요청에 실패했습니다.',
  });
}

export function getAiPostingStatus() {
  return request<AiPostingStatus>('/status');
}

export function getAiPostingTopics() {
  return request<AiPostingTopic[]>('/topics');
}

export function getAiPostingRuns() {
  return request<AiPostingHistoryItem[]>('/runs');
}

export function getAiPostingDraft(id: number) {
  return request<AiPostDraftDetail>(`/drafts/${id}`);
}

export function publishAiPostingDraft(id: number, post: PostCreateRequest) {
  return request<BlogPostDetailApiResponse, { post: PostCreateRequest }>(`/drafts/${id}/publish`, {
    method: 'POST',
    body: { post },
  });
}

export function createAiPostingTopic(requestBody: {
  name: string;
  categoryId: number;
  enabled: boolean;
}) {
  return request<AiPostingTopic, typeof requestBody>('/topics', {
    method: 'POST',
    body: requestBody,
  });
}

export function updateAiPostingTopic(topic: AiPostingTopic) {
  return request<AiPostingTopic, AiPostingTopic>(`/topics/${topic.id}`, {
    method: 'PUT',
    body: topic,
  });
}

export function disableAiPostingTopic(id: number) {
  return request<void>(`/topics/${id}`, { method: 'DELETE' });
}

export function runAiPostingNow() {
  return request<AiPostingRun>('/run', { method: 'POST' });
}
