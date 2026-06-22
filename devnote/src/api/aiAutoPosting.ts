import type {
  AiPostDraftDetail,
  AiPostingHistoryItem,
  AiPostingRun,
  AiPostingStatus,
  AiPostingTopic,
  BlogPostDetailApiResponse,
  PostCreateRequest,
} from '../types';

const AI_AUTO_POSTING_API_URL = '/api/admin/ai-posting';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${AI_AUTO_POSTING_API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error('FORBIDDEN');
  }
  if (!response.ok) {
    throw new Error(`AI 자동 포스팅 요청에 실패했습니다. (${response.status})`);
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return (await response.json()) as T;
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
  return request<BlogPostDetailApiResponse>(`/drafts/${id}/publish`, {
    method: 'POST',
    body: JSON.stringify({ post }),
  });
}

export function createAiPostingTopic(requestBody: {
  name: string;
  categoryId: number;
  enabled: boolean;
}) {
  return request<AiPostingTopic>('/topics', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

export function updateAiPostingTopic(topic: AiPostingTopic) {
  return request<AiPostingTopic>(`/topics/${topic.id}`, {
    method: 'PUT',
    body: JSON.stringify(topic),
  });
}

export function disableAiPostingTopic(id: number) {
  return request<void>(`/topics/${id}`, { method: 'DELETE' });
}

export function runAiPostingNow() {
  return request<AiPostingRun>('/run', { method: 'POST' });
}
