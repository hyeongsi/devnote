import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getBlogCategories } from '../api/categories';
import { getPosts } from '../api/posts';
import { Input } from '../components/ui/Input';
import { Pagination } from '../components/ui/Pagination';
import { Select } from '../components/ui/Select';
import { categoryPopularPosts, popularPosts } from '../data/siteData';
import { PostListItem } from '../features/PostListItem';
import { PostSidebar } from '../features/PostSidebar';
import { usePagination } from '../hooks/usePagination';
import type { BlogCategory, BlogPost } from '../types';

const POSTS_PER_PAGE = 6;

const allCategory: BlogCategory = {
  id: 0,
  slug: 'all',
  name: '전체',
  description: '개발, 자동화, AI 등 다양한 주제의 게시글을 확인할 수 있습니다.',
  count: 0,
  visible: true,
  displayOrder: 0,
};

export function PostListPage() {
  const { categorySlug } = useParams();
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selectedCategory = categorySlug ?? 'all';

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setIsLoading(true);
      setError(null);

      try {
        const [nextPosts, nextCategories] = await Promise.all([getPosts(), getBlogCategories()]);

        if (!cancelled) {
          setPosts(nextPosts);
          setCategories(nextCategories);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '게시글 목록을 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  let filteredPosts =
    selectedCategory === 'all'
      ? posts
      : posts.filter((post) => post.categorySlug === selectedCategory);

  if (query.trim()) {
    const normalized = query.trim().toLowerCase();
    filteredPosts = filteredPosts.filter((post) =>
      `${post.title} ${post.excerpt} ${post.category}`.toLowerCase().includes(normalized),
    );
  }

  if (sortBy === 'popular') {
    filteredPosts = [...filteredPosts].sort((a, b) => b.viewCount - a.viewCount);
  }

  const {
    currentPage,
    setCurrentPage,
    totalItems: totalPosts,
    totalPages,
    paginatedItems: paginatedPosts,
    paginationItems,
  } = usePagination({
    items: filteredPosts,
    itemsPerPage: POSTS_PER_PAGE,
    resetDeps: [selectedCategory, query, sortBy],
  });

  const sidebarPopularPosts = categoryPopularPosts[selectedCategory] ?? popularPosts;
  const sidebarCategories: BlogCategory[] = [
    {
      ...allCategory,
      count: posts.length,
    },
    ...categories,
  ];
  const currentCategory =
    sidebarCategories.find((item) => item.slug === selectedCategory) ?? sidebarCategories[0];

  return (
    <section className="section">
      <div className="mb-10 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        <Link to="/" className="font-medium transition hover:text-primary">
          홈
        </Link>
        <span>/</span>
        <Link to="/posts" className="font-medium transition hover:text-primary">
          블로그
        </Link>
        {selectedCategory !== 'all' ? (
          <>
            <span>/</span>
            <span className="font-semibold text-gray-600">{currentCategory.name}</span>
          </>
        ) : null}
      </div>

      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-950 md:text-[48px]">
          {selectedCategory === 'all' ? '전체 게시글' : currentCategory.name}
        </h1>
        <p className="mt-3 text-lg text-muted">{currentCategory.description ?? allCategory.description}</p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {sidebarCategories.slice(0, 6).map((item) => (
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
                placeholder="제목 또는 내용을 검색해보세요..."
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
            {isLoading ? (
              <div className="rounded-[24px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted">
                게시글 목록을 불러오는 중입니다.
              </div>
            ) : error ? (
              <div className="rounded-[24px] border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-medium text-red-600">
                {error}
              </div>
            ) : totalPosts > 0 ? (
              paginatedPosts.map((post) => <PostListItem key={post.id} post={post} />)
            ) : (
              <div className="rounded-[24px] border border-dashed border-line bg-white px-6 py-12 text-center text-sm font-medium text-muted">
                조건에 맞는 게시글이 없습니다.
              </div>
            )}
          </div>

          {!isLoading && !error ? (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              items={paginationItems}
              onPageChange={setCurrentPage}
            />
          ) : null}
        </div>

        <PostSidebar
          categories={sidebarCategories}
          selectedCategory={selectedCategory}
          popularPosts={sidebarPopularPosts}
        />
      </div>
    </section>
  );
}
