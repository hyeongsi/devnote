import type { DashboardStats } from '../types';

const DASHBOARD_STATS_API_URL = 'http://localhost:8080/api/admin/dashboard/stats';

export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await fetch(DASHBOARD_STATS_API_URL, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`대시보드 통계를 불러오지 못했습니다. (${response.status})`);
  }

  return (await response.json()) as DashboardStats;
}
