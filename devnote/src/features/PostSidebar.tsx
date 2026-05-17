import { Link } from 'react-router-dom';
import { SidebarPanel } from '../components/ui/SidebarPanel';
import { blogCategories } from '../data/siteData';
import type { RankedPost } from '../types';

export function PostSidebar({
  selectedCategory,
  popularPosts,
}: {
  selectedCategory: string;
  popularPosts: RankedPost[];
}) {
  return (
    <aside className="grid h-fit gap-5 self-start">
      <SidebarPanel title="카테고리">
        <div className="grid gap-2.5 text-sm font-semibold text-gray-600">
          {blogCategories.map((category) => {
            const isActive =
              (selectedCategory === 'all' && category.slug === 'all') ||
              category.slug === selectedCategory;

            return (
              <Link
                key={category.slug}
                to={category.slug === 'all' ? '/posts' : `/posts/${category.slug}`}
                className={`flex items-center justify-between rounded-2xl px-3 py-2.5 transition ${
                  isActive ? 'bg-primary-soft text-primary' : 'hover:bg-gray-50'
                }`}
              >
                <span>{category.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {category.count}
                </span>
              </Link>
            );
          })}
        </div>
      </SidebarPanel>

      <SidebarPanel title={selectedCategory === 'all' ? '인기 게시글' : '이 카테고리 인기글'}>
        <div className="space-y-4">
          {popularPosts.map((post) => (
            <div
              key={`${post.rank}-${post.title}`}
              className="grid grid-cols-[28px_1fr_auto] items-start gap-3"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary">
                {post.rank}
              </span>
              <div>
                <p className="text-sm font-semibold leading-6 text-gray-800">{post.title}</p>
                <p className="mt-1 text-xs text-muted">조회 {post.views}</p>
              </div>
              <span className="text-xs font-semibold text-gray-400">TOP</span>
            </div>
          ))}
        </div>
      </SidebarPanel>
    </aside>
  );
}
