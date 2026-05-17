import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { SectionHeader } from '../components/ui/SectionHeader';
import {
  blogPosts,
  featuredProjects,
  stackItems,
} from '../data/siteData';
import { HomeHero } from '../features/HomeHero';
import { PostPreviewCard } from '../features/PostPreviewCard';
import { ProjectPreviewCard } from '../features/ProjectPreviewCard';

export function HomePage() {
  return (
    <>
      <HomeHero />

      <section className="section pt-6">
        <SectionHeader
          title="최신 글"
          action={<Link to="/posts" className="font-semibold text-gray-600 transition hover:text-primary">전체 보기 →</Link>}
        />
        <div className="grid gap-5 lg:grid-cols-4">
          {blogPosts.slice(1, 5).map((post) => (
            <PostPreviewCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      <section className="section pt-6">
        <SectionHeader
          title="주요 프로젝트"
          action={<Link to="/posts/devops" className="font-semibold text-gray-600 transition hover:text-primary">전체 보기 →</Link>}
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
            <Card key={item.name} className="rounded-[22px] p-5 text-center shadow-[0_14px_40px_rgba(17,24,39,0.03)]">
              <div className="text-4xl font-black text-primary">{item.symbol}</div>
              <div className="mt-4 text-base font-bold text-gray-900">{item.name}</div>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}
