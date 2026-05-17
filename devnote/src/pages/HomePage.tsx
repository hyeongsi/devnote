import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPosts } from '../api/posts';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import { featuredProjects, stackItems } from '../data/siteData';
import { HomeHero } from '../features/HomeHero';
import { PostPreviewCard } from '../features/PostPreviewCard';
import { ProjectPreviewCard } from '../features/ProjectPreviewCard';
import type { BlogPost } from '../types';

export function HomePage() {
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);
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
          setLatestPosts(posts.slice(0, 4));
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
        <div className="grid gap-5 lg:grid-cols-4">
          {isLoadingPosts ? (
            <div className="lg:col-span-4 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted">
              최신 글을 불러오는 중입니다.
            </div>
          ) : postsError ? (
            <div className="lg:col-span-4 rounded-[22px] border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-medium text-red-600">
              {postsError}
            </div>
          ) : latestPosts.length > 0 ? (
            latestPosts.map((post) => <PostPreviewCard key={post.id} post={post} />)
          ) : (
            <div className="lg:col-span-4 rounded-[22px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted">
              표시할 최신 글이 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="section pt-6">
        <SectionHeader
          title="주요 프로젝트"
          action={
            <Link
              to="/posts/devops"
              className="font-semibold text-gray-600 transition hover:text-primary"
            >
              전체 보기 →
            </Link>
          }
        />
        <div className="grid gap-5 lg:grid-cols-3">
          {featuredProjects.map((project) => (
            <ProjectPreviewCard key={project.id} project={project} />
          ))}
        </div>
      </section>

      <section className="section pt-6">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">기술 스택</h2>
          <div className="flex flex-wrap gap-3 text-sm font-semibold">
            {['전체', 'Backend', 'Frontend', 'DevOps', 'AI', 'Database'].map((filter, index) => (
              <button
                key={filter}
                type="button"
                className={`rounded-full px-4 py-2 ${
                  index === 0 ? 'bg-primary-soft text-primary' : 'text-gray-500'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-10">
          {stackItems.map((item) => (
            <Card
              key={item.name}
              className="rounded-[22px] p-5 text-center shadow-[0_14px_40px_rgba(17,24,39,0.03)]"
            >
              <div className="text-4xl font-black text-primary">{item.symbol}</div>
              <div className="mt-4 text-base font-bold text-gray-900">{item.name}</div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
