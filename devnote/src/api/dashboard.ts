import type { DashboardActivity, DashboardStats, DashboardTrafficPoint } from '../types';
import { fetchAdmin } from './adminAuth';
import { apiRequest } from './http';

const DASHBOARD_API_URL = '/api/admin/dashboard';

export async function getDashboardStats(): Promise<DashboardStats> {
  return getDashboardResource<DashboardStats>('stats');
}

export async function getDashboardTraffic(): Promise<DashboardTrafficPoint[]> {
  return getDashboardResource<DashboardTrafficPoint[]>('traffic');
}

export async function getDashboardActivities(): Promise<DashboardActivity[]> {
  return getDashboardResource<DashboardActivity[]>('activities');
}

async function getDashboardResource<T>(resource: string): Promise<T> {
  return apiRequest<T>(`${DASHBOARD_API_URL}/${resource}`, {
    request: fetchAdmin,
    errorMessage: '대시보드 데이터를 불러오지 못했습니다.',
  });
}
