import { Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import {
  allBlogPosts,
  blogCategories,
  categoryPopularPosts,
  popularPosts,
} from '../data/siteData';
import { PostListItem } from '../features/PostListItem';
import { PostSidebar } from '../features/PostSidebar';

const categoryDescriptions: Record<string, string> = {
  all: '개발, 자동화, AI에 대한 다양한 인사이트를 확인하세요.',
  'spring-boot': 'Spring Boot 관련 다양한 팁과 튜토리얼을 확인하세요.',
  'ai-automation': 'AI와 자동화 도구를 실전에 적용한 기록을 모았습니다.',
  devops: '배포, 인프라, 협업 자동화 관련 글을 살펴보세요.',
  java: 'Java 언어와 백엔드 개발 팁을 정리했습니다.',
  database: '데이터 모델링과 성능 최적화 기록입니다.',
  infra: '서버, 운영, 모니터링 관련 노트를 모아두었습니다.',
  etc: '기타 개발 기록과 실험 내용을 담았습니다.',
};

export function PostListPage() {
  const { categorySlug } = useParams();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const selectedCategory = categorySlug ?? 'all';
  const category = blogCategories.find((item) => item.slug === selectedCategory) ?? blogCategories[0];

  let filteredPosts =
    selectedCategory === 'all'
      ? allBlogPosts
      : allBlogPosts.filter((post) => post.categorySlug === selectedCategory);

  if (query.trim()) {
    const normalized = query.trim().toLowerCase();
    filteredPosts = filteredPosts.filter((post) =>
      `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(normalized),
    );
  }

  if (sortBy === 'popular') {
    filteredPosts = [...filteredPosts].sort(
      (a, b) => Number.parseFloat(b.views) - Number.parseFloat(a.views),
    );
  }

  const sidebarPopularPosts = categoryPopularPosts[selectedCategory] ?? popularPosts;

  return (
    <section className="section">
      <div className="mb-10 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="font-medium transition hover:text-primary">
          홈
        </Link>
        <span>›</span>
        <Link to="/posts" className="font-medium transition hover:text-primary">
          블로그
        </Link>
        {selectedCategory !== 'all' ? (
          <>
            <span>›</span>
            <span className="font-semibold text-gray-600">{category.name}</span>
          </>
        ) : null}
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-950 md:text-[48px]">
          {selectedCategory === 'all' ? '전체 게시글' : category.name}
        </h1>
        <p className="mt-3 text-lg text-muted">{categoryDescriptions[selectedCategory]}</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {blogCategories.slice(0, 6).map((item) => (
          <Link
            key={item.slug}
            to={item.slug === 'all' ? '/posts' : `/posts/${item.slug}`}
            className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
              item.slug === selectedCategory
                ? 'border-primary bg-primary text-white'
                : 'border-line bg-white text-gray-600 hover:border-primary hover:text-primary'
            }`}
          >
            {item.name}
          </Link>
        ))}
      </div>

      <div className="mt-7 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1fr_180px]">
            <div className="relative">
              <Input
                placeholder="제목 또는 내용을 검색하세요..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="pr-12"
              />
              <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
            <Select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <PostListItem key={post.id} post={post} />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 pt-3 text-sm font-bold">
            {['1', '2', '3', '4', '5', '...', '10'].map((item, index) => (
              <button
                key={`${item}-${index}`}
                type="button"
                className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                  index === 0 ? 'bg-primary text-white' : 'text-gray-600 hover:bg-primary-soft hover:text-primary'
                }`}
              >
                {item}
              </button>
            ))}
            <button type="button" className="px-2 text-gray-600 transition hover:text-primary">
              &gt;
            </button>
          </div>
        </div>

        <PostSidebar selectedCategory={selectedCategory} popularPosts={sidebarPopularPosts} />
      </div>
    </section>
  );
}
