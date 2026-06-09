import {
  CalendarDays,
  Clock3,
  ExternalLink,
  Eye,
  FilePlus2,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deletePost, getPosts } from '../../api/posts';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import {
  filterAndSortAdminPosts,
  type AdminPostSort,
} from '../../features/admin/adminPostManagement';
import { usePagination } from '../../hooks/usePagination';
import type { BlogPost } from '../../types';
import { formatViewCount } from '../../utils/postMetadata';

const POSTS_PER_PAGE = 9;

export function AdminPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [query, setQuery] = useState('');
  const [categorySlug, setCategorySlug] = useState('all');
  const [sortBy, setSortBy] = useState<AdminPostSort>('latest');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPosts() {
      setIsLoading(true);
      setError(null);

      try {
        const nextPosts = await getPosts();

        if (!cancelled) {
          setPosts(nextPosts);
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

  const categories = useMemo(
    () =>
      Array.from(
        new Map(posts.map((post) => [post.categorySlug, post.category])).entries(),
      ).sort((first, second) => first[1].localeCompare(second[1])),
    [posts],
  );
  const managedPosts = filterAndSortAdminPosts(posts, {
    query,
    categorySlug,
    sortBy,
  });
  const {
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    paginatedItems,
    paginationItems,
  } = usePagination({
    items: managedPosts,
    itemsPerPage: POSTS_PER_PAGE,
    resetKey: `${query}:${categorySlug}:${sortBy}:${posts.length}`,
  });

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deletePost(deleteTarget.categorySlug, deleteTarget.slug);
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (deletePostError) {
      setDeleteError(
        deletePostError instanceof Error
          ? deletePostError.message
          : '게시글을 삭제하는 중 문제가 발생했습니다.',
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="border-b border-line pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">
              총 {posts.length.toLocaleString('ko-KR')}개의 게시글
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-gray-950">
              게시글 관리
            </h2>
          </div>
          <Link
            to="/admin/ai-posting"
            className="inline-flex items-center justify-center gap-2 rounded-[10px] bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-dark"
          >
            <FilePlus2 className="h-4 w-4" />
            새 게시글
          </Link>
        </div>
      </section>

      <section className="grid gap-3 border-b border-line pb-5 lg:grid-cols-[minmax(260px,1fr)_220px_180px_auto]">
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 요약, 태그 검색"
            className="pr-11"
          />
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        </div>
        <Select
          value={categorySlug}
          onChange={(event) => setCategorySlug(event.target.value)}
          aria-label="카테고리 필터"
        >
          <option value="all">전체 카테고리</option>
          {categories.map(([slug, name]) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </Select>
        <Select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as AdminPostSort)}
          aria-label="게시글 정렬"
        >
          <option value="latest">최신순</option>
          <option value="views">조회순</option>
        </Select>
        <div className="flex min-h-12 items-center justify-end text-sm font-semibold text-gray-500">
          검색 결과 {totalItems.toLocaleString('ko-KR')}개
        </div>
      </section>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[310px] animate-pulse rounded-lg border border-line bg-white"
            />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : paginatedItems.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paginatedItems.map((post) => (
              <article
                key={post.id}
                className="flex min-h-[310px] flex-col rounded-lg border border-line bg-white p-5 shadow-[0_12px_36px_rgba(17,24,39,0.04)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-bold text-primary">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Link
                      to={`/posts/${post.categorySlug}/${post.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-9 w-9 place-items-center rounded-lg text-gray-500 transition hover:bg-gray-50 hover:text-primary"
                      title="공개 페이지 미리보기"
                      aria-label={`${post.title} 미리보기`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteTarget(post);
                      }}
                      className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                      title="게시글 삭제"
                      aria-label={`${post.title} 삭제`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="mt-4 line-clamp-2 text-lg font-black leading-7 text-gray-950">
                  {post.title}
                </h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">
                  {post.excerpt}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-500"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 3 ? (
                    <span className="rounded-md bg-gray-50 px-2 py-1 text-xs font-semibold text-gray-400">
                      +{post.tags.length - 3}
                    </span>
                  ) : null}
                </div>

                <dl className="mt-auto grid grid-cols-3 gap-2 border-t border-line pt-4 text-xs text-gray-500">
                  <div>
                    <dt className="flex items-center gap-1 font-semibold">
                      <CalendarDays className="h-3.5 w-3.5" />
                      게시일
                    </dt>
                    <dd className="mt-1 font-bold text-gray-700">{post.displayDate}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 font-semibold">
                      <Eye className="h-3.5 w-3.5" />
                      조회
                    </dt>
                    <dd className="mt-1 font-bold text-gray-700">
                      {formatViewCount(post.viewCount)}
                    </dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 font-semibold">
                      <Clock3 className="h-3.5 w-3.5" />
                      읽기
                    </dt>
                    <dd className="mt-1 font-bold text-gray-700">{post.readTime}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            items={paginationItems}
            onPageChange={setCurrentPage}
          />
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center text-sm font-semibold text-muted">
          조건에 맞는 게시글이 없습니다.
        </p>
      )}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-gray-950/35 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-post-title"
            className="w-full max-w-md rounded-lg border border-line bg-white p-6 shadow-2xl"
          >
            <h3 id="delete-post-title" className="text-xl font-black text-gray-950">
              게시글을 삭제할까요?
            </h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              <strong className="text-gray-800">{deleteTarget.title}</strong>
              <br />
              삭제한 게시글은 복구할 수 없습니다.
            </p>
            {deleteError ? (
              <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                type="button"
                className="bg-red-600 shadow-none hover:bg-red-700"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isDeleting ? '삭제 중' : '삭제'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
