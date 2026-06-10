import {
  ArrowRight,
  Bot,
  Coffee,
  Container,
  Database,
  Eye,
  Leaf,
  Server,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { SectionHeader } from '../components/ui/SectionHeader';
import { HomeHero } from '../features/HomeHero';
import { buildHomeContent } from '../features/homeContent';
import type { BlogPost } from '../types';
import { formatViewCount } from '../utils/postMetadata';

const categoryStyles = [
  { icon: Leaf, color: 'text-emerald-600', iconBox: 'bg-emerald-50 border-emerald-200' },
  { icon: Bot, color: 'text-violet-600', iconBox: 'bg-violet-50 border-violet-200' },
  { icon: Container, color: 'text-blue-600', iconBox: 'bg-blue-50 border-blue-200' },
  { icon: Coffee, color: 'text-orange-600', iconBox: 'bg-orange-50 border-orange-200' },
  { icon: Database, color: 'text-cyan-700', iconBox: 'bg-cyan-50 border-cyan-200' },
  { icon: Server, color: 'text-indigo-600', iconBox: 'bg-indigo-50 border-indigo-200' },
];

export function HomePage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLatestPosts() {
      setIsLoadingPosts(true);
      setPostsError(null);

      try {
        const posts = await getPosts();

        if (!cancelled) {
          setPosts(posts);
        }
      } catch (error) {
        if (!cancelled) {
          setPostsError(
            error instanceof Error
              ? error.message
              : '최신 글을 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingPosts(false);
        }
      }
    }

    void loadLatestPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const { latestPosts, popularPosts, categories } = useMemo(
    () => buildHomeContent(posts),
    [posts],
  );

  return (
    <>
      <HomeHero />

      <section className="section pt-6">
        <SectionHeader
          title="최신 글"
          action={
            <Link to="/posts" className="font-semibold text-gray-600 transition hover:text-primary">
              전체 보기 →
            </Link>
          }
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {isLoadingPosts ? (
            <div className="lg:col-span-4 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted">
              최신 글을 불러오는 중입니다.
            </div>
          ) : postsError ? (
            <div className="lg:col-span-4 rounded-[22px] border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-medium text-red-600">
              {postsError}
            </div>
          ) : latestPosts.length > 0 ? (
            latestPosts.map((post) => (
              <Link
                key={post.id}
                to={`/posts/${post.categorySlug}/${post.slug}`}
                className="group flex min-h-[270px] flex-col rounded-lg border border-line bg-white p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_16px_40px_rgba(17,24,39,0.06)]"
              >
                <p className="text-sm font-semibold text-primary">{post.category}</p>
                <h3 className="mt-4 line-clamp-2 text-xl font-black leading-7 text-gray-950">
                  {post.title}
                </h3>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">
                  {post.excerpt}
                </p>
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-6 text-xs font-medium text-gray-500">
                  <span>{post.displayDate}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.readTime}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {formatViewCount(post.viewCount)}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <div className="lg:col-span-4 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted">
              표시할 최신 글이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section id="popular-posts" className="section scroll-mt-24 pt-6">
        <SectionHeader
          title="인기 게시글"
          action={
            <Link
              to="/posts"
              className="font-semibold text-gray-600 transition hover:text-primary"
            >
              전체 보기 →
            </Link>
          }
        />
        <div className="grid gap-3">
          {popularPosts.length > 0 ? (
            popularPosts.map((post, index) => (
              <Link
                key={post.id}
                to={`/posts/${post.categorySlug}/${post.slug}`}
                className="group grid min-h-32 items-center gap-4 rounded-lg border border-line bg-white px-5 py-4 transition hover:border-primary/30 hover:shadow-[0_12px_32px_rgba(17,24,39,0.05)] lg:grid-cols-[112px_minmax(0,1fr)_120px]"
              >
                <RankBadge rank={index + 1} index={index} />
                <div className="min-w-0">
                  <p
                    className={`text-xs font-bold ${
                      ['text-violet-600', 'text-blue-600', 'text-emerald-700'][index]
                    }`}
                  >
                    {post.category}
                  </p>
                  <h3 className="mt-1 truncate text-lg font-black text-gray-950">
                    {post.title}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{post.excerpt}</p>
                </div>
                <div className="flex items-center justify-between border-t border-line pt-3 lg:block lg:border-l lg:border-t-0 lg:py-2 lg:pl-7 lg:text-right">
                  <span className="block text-xs font-medium text-gray-500">조회</span>
                  <strong
                    className={`mt-1 block text-2xl font-black ${
                      ['text-violet-600', 'text-blue-600', 'text-emerald-700'][index]
                    }`}
                  >
                    {post.viewCount.toLocaleString('ko-KR')}
                  </strong>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted lg:col-span-3">
              표시할 인기 게시글이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="section pt-6">
        <SectionHeader title="카테고리별 글 탐색" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {categories.length > 0 ? (
            categories.map((category, index) => (
              <CategoryLink key={category.slug} category={category} index={index} />
            ))
          ) : (
            <div
              className="rounded-lg border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted lg:col-span-3 xl:col-span-6"
            >
              표시할 카테고리가 없습니다.
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function CategoryLink({
  category,
  index,
}: {
  category: { slug: string; name: string; count: number };
  index: number;
}) {
  const style = categoryStyles[index] ?? categoryStyles[categoryStyles.length - 1];
  const Icon = style.icon;

  return (
    <Link
      to={`/posts/${category.slug}`}
      className="group flex min-h-[190px] flex-col items-center justify-center rounded-lg border border-line bg-white p-5 text-center transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_16px_38px_rgba(17,24,39,0.07)]"
    >
      <span
        className={`grid h-16 w-16 place-items-center rounded-full border shadow-[inset_0_0_0_5px_rgba(255,255,255,0.65)] ${style.iconBox} ${style.color}`}
      >
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-4 text-base font-black text-gray-950">{category.name}</h3>
      <div className="mt-3 flex w-full items-center justify-center gap-5">
        <strong className={`text-2xl font-black ${style.color}`}>{category.count}</strong>
        <ArrowRight className="h-5 w-5 text-gray-600 transition group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  );
}

function RankBadge({ rank, index }: { rank: number; index: number }) {
  const color = ['text-violet-500', 'text-blue-500', 'text-emerald-600'][index];

  return (
    <div
      aria-label={`${index + 1}위`}
      className={`relative flex h-20 items-center justify-center ${color}`}
    >
      <Leaf
        aria-hidden="true"
        className="absolute left-1 h-12 w-12 rotate-[-28deg] stroke-[1.5]"
      />
      <Leaf
        aria-hidden="true"
        className="absolute right-1 h-12 w-12 scale-x-[-1] rotate-[-28deg] stroke-[1.5]"
      />
      <span className="relative z-10 text-4xl font-black">{rank}</span>
    </div>
  );
}
