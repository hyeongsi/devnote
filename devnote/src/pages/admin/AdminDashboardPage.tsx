import { Eye, FileText, MessageSquare, ThumbsUp, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboardActivities,
  getDashboardStats,
  getDashboardTraffic,
} from '../../api/dashboard';
import { getPosts } from '../../api/posts';
import { AdminStatCard } from '../../features/admin/AdminStatCard';
import type {
  AdminStat,
  DashboardActivity,
  DashboardActivityType,
  DashboardStats,
  DashboardTrafficPoint,
  RankedPost,
} from '../../types';
import { buildPopularPosts } from '../../utils/popularPosts';

export function AdminDashboardPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [trafficPoints, setTrafficPoints] = useState<DashboardTrafficPoint[]>([]);
  const [recentActivities, setRecentActivities] = useState<DashboardActivity[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [topPosts, setTopPosts] = useState<RankedPost[]>([]);
  const [isLoadingTopPosts, setIsLoadingTopPosts] = useState(true);
  const [topPostsError, setTopPostsError] = useState<string | null>(null);
  const maxValue = Math.max(1, ...trafficPoints.map((point) => point.value));
  const points = trafficPoints
    .map((point, index) => {
      const x = (index / (trafficPoints.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardStats() {
      setIsLoadingStats(true);
      setStatsError(null);

      try {
        const [stats, traffic, activities] = await Promise.all([
          getDashboardStats(),
          getDashboardTraffic(),
          getDashboardActivities(),
        ]);

        if (!cancelled) {
          setDashboardStats(stats);
          setTrafficPoints(traffic);
          setRecentActivities(activities);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDashboardStats(null);
          setTrafficPoints([]);
          setRecentActivities([]);
          setStatsError(
            loadError instanceof Error
              ? loadError.message
              : '대시보드 통계를 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStats(false);
        }
      }
    }

    void loadDashboardStats();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTopPosts() {
      setIsLoadingTopPosts(true);
      setTopPostsError(null);

      try {
        const posts = await getPosts();

        if (!cancelled) {
          setTopPosts(buildPopularPosts(posts));
        }
      } catch (loadError) {
        if (!cancelled) {
          setTopPosts([]);
          setTopPostsError(
            loadError instanceof Error
              ? loadError.message
              : '인기 게시글을 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTopPosts(false);
        }
      }
    }

    void loadTopPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const adminStats: AdminStat[] = dashboardStats
    ? [
        {
          label: '총 게시글',
          value: formatStatValue(dashboardStats.totalPosts),
          note: '현재 등록된 게시글',
          tone: 'violet',
          icon: FileText,
        },
        {
          label: '총 조회수',
          value: formatStatValue(dashboardStats.totalViews),
          note: '전체 게시글 누적',
          tone: 'green',
          icon: Eye,
        },
        {
          label: '좋아요 수',
          value: formatStatValue(dashboardStats.totalLikes),
          note: '전체 게시글 누적',
          tone: 'blue',
          icon: ThumbsUp,
        },
        {
          label: '댓글 수',
          value: formatStatValue(dashboardStats.totalComments),
          note: '전체 게시글 누적',
          tone: 'orange',
          icon: MessageSquare,
        },
        {
          label: '신규 구독자',
          value: formatStatValue(dashboardStats.newSubscribers),
          note: '최근 7일',
          tone: 'pink',
          icon: UserPlus,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)] md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-gray-950">
              안녕하세요, 관리자님! <span className="inline-block">👋</span>
            </h2>
            <p className="mt-3 text-lg text-muted">오늘도 DevNote를 관리해보세요.</p>
          </div>
          <div className="rounded-2xl border border-line px-5 py-4 text-sm font-semibold text-gray-700">
            실시간 누적 통계
          </div>
        </div>

        {isLoadingStats ? (
          <div className="mt-8 grid gap-4 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-[190px] animate-pulse rounded-[24px] border border-line bg-gray-50"
              />
            ))}
          </div>
        ) : statsError ? (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm font-semibold text-red-600">
            {statsError}
          </p>
        ) : (
          <div className="mt-8 grid gap-4 xl:grid-cols-5">
            {adminStats.map((stat) => (
              <AdminStatCard key={stat.label} stat={stat} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr_0.75fr]">
        <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-gray-950">조회수 추이</h3>
            <button type="button" className="rounded-xl border border-line px-4 py-2 text-sm font-semibold text-gray-600">
              일간
            </button>
          </div>

          <div className="mt-8">
            {isLoadingStats ? (
              <div className="h-[240px] animate-pulse rounded-2xl bg-gray-50" />
            ) : statsError ? (
              <p className="grid h-[240px] place-items-center text-sm font-semibold text-red-600">
                조회수 추이를 불러오지 못했습니다.
              </p>
            ) : (
            <svg viewBox="0 0 100 100" className="h-[240px] w-full">
              {[20, 40, 60, 80].map((line) => (
                <line key={line} x1="0" y1={line} x2="100" y2={line} stroke="#ececf6" strokeDasharray="3 4" />
              ))}
              <polyline
                fill="none"
                stroke="url(#trafficGradient)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />
              {trafficPoints.map((point, index) => {
                const x = (index / (trafficPoints.length - 1)) * 100;
                const y = 100 - (point.value / maxValue) * 100;
                return (
                  <g key={point.date}>
                    <circle cx={x} cy={y} r="2.2" fill="white" stroke="#6d5dfc" strokeWidth="2" />
                    <text x={x} y="106" textAnchor="middle" fontSize="4" fill="#97a0b4">
                      {formatTrafficDate(point.date)}
                    </text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="trafficGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7d6cff" />
                  <stop offset="100%" stopColor="#5d4dff" />
                </linearGradient>
              </defs>
            </svg>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-gray-950">인기 게시글 TOP 5</h3>
            <Link to="/posts" className="text-sm font-bold text-primary">
              전체 보기 →
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {isLoadingTopPosts ? (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm font-semibold text-muted">
                인기 게시글을 불러오는 중입니다.
              </p>
            ) : topPostsError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm font-semibold text-red-600">
                {topPostsError}
              </p>
            ) : topPosts.length > 0 ? (
              topPosts.map((post) => (
                <Link
                  key={`${post.categorySlug}-${post.slug}`}
                  to={`/posts/${post.categorySlug}/${post.slug}`}
                  className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-2xl transition hover:bg-gray-50"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary">
                    {post.rank}
                  </span>
                  <p className="text-sm font-semibold leading-6 text-gray-800">{post.title}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400">
                    <Eye className="h-3.5 w-3.5" />
                    {post.views}
                  </span>
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm font-semibold text-muted">
                인기 게시글이 없습니다.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)]">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black tracking-tight text-gray-950">최근 활동</h3>
            <span className="text-sm font-bold text-primary">최근 5건</span>
          </div>

          <div className="mt-6 space-y-5">
            {isLoadingStats ? (
              <div className="h-[180px] animate-pulse rounded-2xl bg-gray-50" />
            ) : statsError ? (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-8 text-center text-sm font-semibold text-red-600">
                최근 활동을 불러오지 못했습니다.
              </p>
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity) => {
                const metadata = activityMetadata[activity.type];

                return (
                  <div key={activity.id} className="grid grid-cols-[16px_1fr_auto] items-start gap-3">
                    <span className={`mt-2 h-2.5 w-2.5 rounded-full ${metadata.tone}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{metadata.title}</p>
                      <p className="mt-1 text-sm text-muted">{activity.description}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400">
                      {formatTimeAgo(activity.occurredAt)}
                    </span>
                  </div>
                );
              })
            ) : (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm font-semibold text-muted">
                최근 활동이 없습니다.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function formatStatValue(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value);
}

const activityMetadata: Record<
  DashboardActivityType,
  { title: string; tone: string }
> = {
  POST_CREATED: { title: '새 게시글이 등록되었습니다', tone: 'bg-sky-500' },
  COMMENT_CREATED: { title: '새 댓글이 등록되었습니다', tone: 'bg-orange-500' },
  POST_LIKED: { title: '게시글에 좋아요가 추가되었습니다', tone: 'bg-emerald-500' },
  SUBSCRIBER_CREATED: { title: '신규 구독자가 추가되었습니다', tone: 'bg-violet-500' },
};

function formatTrafficDate(date: string) {
  const [, month, day] = date.split('-');
  return `${month}/${day}`;
}

function formatTimeAgo(occurredAt: string) {
  const elapsedMilliseconds = Date.now() - new Date(occurredAt).getTime();
  const elapsedMinutes = Math.max(0, Math.floor(elapsedMilliseconds / 60_000));

  if (elapsedMinutes < 1) {
    return '방금 전';
  }
  if (elapsedMinutes < 60) {
    return `${elapsedMinutes}분 전`;
  }

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  if (elapsedHours < 24) {
    return `${elapsedHours}시간 전`;
  }

  return `${Math.floor(elapsedHours / 24)}일 전`;
}
