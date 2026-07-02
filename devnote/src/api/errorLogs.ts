import type { ErrorLogDetail, ErrorLogSearchParams, ErrorLogSummary } from '../types';
import { fetchAdmin } from './adminAuth';

const ERROR_LOGS_API_URL = '/api/admin/error-logs';

export async function getErrorLogs(params: ErrorLogSearchParams = {}): Promise<ErrorLogSummary[]> {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  const url = searchParams.size > 0
    ? `${ERROR_LOGS_API_URL}?${searchParams.toString()}`
    : ERROR_LOGS_API_URL;

  return request<ErrorLogSummary[]>(url);
}

export async function getErrorLogDetail(id: number): Promise<ErrorLogDetail> {
  return request<ErrorLogDetail>(`${ERROR_LOGS_API_URL}/${id}`);
}

async function request<T>(url: string): Promise<T> {
  const response = await fetchAdmin(url);

  if (!response.ok) {
    throw new Error(`에러 로그를 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as T;
}
