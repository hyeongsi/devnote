import { ExternalLink, MessageCircle, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteAdminComment, getAdminComments } from '../../api/comments';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { useFeedback } from '../../features/feedback/FeedbackContext';
import { usePagination } from '../../hooks/usePagination';
import type { AdminComment } from '../../types';

const COMMENTS_PER_PAGE = 10;

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function AdminCommentsPage() {
  const { showConfirm, showMessage } = useFeedback();
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setIsLoading(true);
      setError(null);

      try {
        const nextComments = await getAdminComments();
        if (!cancelled) {
          setComments(nextComments);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '댓글 목록을 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadComments();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredComments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return comments;
    }

    return comments.filter((comment) =>
      [
        comment.postTitle,
        comment.authorName,
        comment.content,
        comment.categorySlug,
        comment.postSlug,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [comments, query]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems,
    paginationItems,
  } = usePagination({
    items: filteredComments,
    itemsPerPage: COMMENTS_PER_PAGE,
    resetKey: `${query}:${comments.length}`,
  });

  async function handleDelete(comment: AdminComment) {
    const accepted = await showConfirm({
      title: '댓글을 삭제할까요?',
      description: `"${comment.authorName}"님의 댓글은 삭제 후 복구할 수 없습니다.`,
      confirmLabel: '삭제',
      cancelLabel: '취소',
      tone: 'error',
    });

    if (!accepted) {
      return;
    }

    setDeletingId(comment.id);

    try {
      await deleteAdminComment(comment.id);
      setComments((currentComments) =>
        currentComments.filter((currentComment) => currentComment.id !== comment.id),
      );
      showMessage({
        title: '댓글 삭제 완료',
        description: '댓글이 삭제되었습니다.',
        tone: 'success',
      });
    } catch (deleteError) {
      showMessage({
        title: '댓글 삭제 실패',
        description:
          deleteError instanceof Error
            ? deleteError.message
            : '댓글을 삭제하는 중 문제가 발생했습니다.',
        tone: 'error',
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-bold text-primary">Comments</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950">댓글 관리</h1>
          <p className="mt-2 text-muted">
            방문자가 남긴 댓글을 확인하고 운영자가 직접 삭제할 수 있습니다.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm ring-1 ring-line">
          <MessageCircle className="h-4 w-4 text-primary" />
          총 {comments.length.toLocaleString('ko-KR')}개
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-line bg-white p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            placeholder="게시글, 작성자, 댓글 내용으로 검색"
            className="pl-11"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        {isLoading ? (
          <div className="p-8 text-center text-sm font-semibold text-muted">
            댓글 목록을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm font-semibold text-red-600">{error}</div>
        ) : paginatedItems.length === 0 ? (
          <div className="p-8 text-center text-sm font-semibold text-muted">
            조건에 맞는 댓글이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {paginatedItems.map((comment) => (
              <article key={comment.id} className="p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-black text-gray-950">{comment.authorName}</span>
                      <span className="text-gray-300">/</span>
                      <Link
                        to={`/posts/${comment.categorySlug}/${comment.postSlug}`}
                        className="inline-flex min-w-0 items-center gap-1 font-bold text-primary"
                      >
                        <span className="truncate">{comment.postTitle}</span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </Link>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-muted">
                      {formatCommentDate(comment.createdAt)}
                    </p>
                    <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                      {comment.content}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
                    disabled={deletingId === comment.id}
                    onClick={() => void handleDelete(comment)}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingId === comment.id ? '삭제 중' : '삭제'}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        items={paginationItems}
        onPageChange={setCurrentPage}
      />
    </section>
  );
}
