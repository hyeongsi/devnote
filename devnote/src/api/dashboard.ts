import type { DashboardActivity, DashboardStats, DashboardTrafficPoint } from '../types';

const DASHBOARD_API_URL = 'http://localhost:8080/api/admin/dashboard';

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
  const response = await fetch(`${DASHBOARD_API_URL}/${resource}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`대시보드 데이터를 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as T;
}
