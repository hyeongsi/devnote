import type { ErrorLogDetail, ErrorLogSummary } from '../types';

const ERROR_LOGS_API_URL = '/api/admin/error-logs';

export async function getErrorLogs(): Promise<ErrorLogSummary[]> {
  return request<ErrorLogSummary[]>(ERROR_LOGS_API_URL);
}

export async function getErrorLogDetail(id: number): Promise<ErrorLogDetail> {
  return request<ErrorLogDetail>(`${ERROR_LOGS_API_URL}/${id}`);
}

async function request<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
  });

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!response.ok) {
    throw new Error(`에러 로그를 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as T;
}
