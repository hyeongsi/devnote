import { MessageCircle, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import {
  createPostComment,
  deletePostComment,
  getPostComments,
} from '../../api/comments';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { useFeedback } from '../../features/feedback/FeedbackContext';
import type { PostComment } from '../../types';

interface PostCommentsProps {
  categorySlug: string;
  postSlug: string;
}

const initialForm = {
  authorName: '',
  password: '',
  content: '',
};

function formatCommentDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function PostComments({ categorySlug, postSlug }: PostCommentsProps) {
  const { showMessage } = useFeedback();
  const [comments, setComments] = useState<PostComment[]>([]);
  const [form, setForm] = useState(initialForm);
  const [deletePasswords, setDeletePasswords] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadComments() {
      setIsLoading(true);
      setError(null);

      try {
        const nextComments = await getPostComments(categorySlug, postSlug);
        if (!cancelled) {
          setComments(nextComments);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '댓글을 불러오는 중 문제가 발생했습니다.',
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
  }, [categorySlug, postSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const savedComment = await createPostComment(categorySlug, postSlug, form);
      setComments((currentComments) => [...currentComments, savedComment]);
      setForm(initialForm);
      showMessage({
        title: '댓글 등록 완료',
        description: '댓글이 등록되었습니다.',
        tone: 'success',
      });
    } catch (submitError) {
      showMessage({
        title: '댓글 등록 실패',
        description:
          submitError instanceof Error
            ? submitError.message
            : '댓글을 등록하는 중 문제가 발생했습니다.',
        tone: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: number) {
    const password = deletePasswords[commentId] ?? '';
    setDeletingId(commentId);

    try {
      await deletePostComment(categorySlug, postSlug, commentId, { password });
      setComments((currentComments) =>
        currentComments.filter((comment) => comment.id !== commentId),
      );
      setDeletePasswords((currentPasswords) => {
        const nextPasswords = { ...currentPasswords };
        delete nextPasswords[commentId];
        return nextPasswords;
      });
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
    <section className="mt-12 border-t border-line pt-10" aria-labelledby="post-comments-title">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 id="post-comments-title" className="text-2xl font-black text-gray-950">
            댓글
          </h2>
          <p className="mt-2 text-sm text-muted">
            닉네임과 비밀번호로 댓글을 남길 수 있습니다.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-sm font-bold text-primary">
          <MessageCircle className="h-4 w-4" />
          {comments.length}
        </span>
      </div>

      <form className="mt-6 rounded-lg border border-line bg-white p-5" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            value={form.authorName}
            maxLength={80}
            placeholder="닉네임"
            onChange={(event) =>
              setForm((currentForm) => ({ ...currentForm, authorName: event.target.value }))
            }
          />
          <Input
            value={form.password}
            type="password"
            minLength={4}
            maxLength={50}
            placeholder="삭제용 비밀번호"
            onChange={(event) =>
              setForm((currentForm) => ({ ...currentForm, password: event.target.value }))
            }
          />
        </div>
        <Textarea
          value={form.content}
          maxLength={2000}
          placeholder="댓글을 입력해 주세요."
          className="mt-3"
          onChange={(event) =>
            setForm((currentForm) => ({ ...currentForm, content: event.target.value }))
          }
        />
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? '등록 중' : '댓글 등록'}
          </Button>
        </div>
      </form>

      <div className="mt-6 space-y-4">
        {isLoading ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-6 text-sm text-muted">
            댓글을 불러오는 중입니다.
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-100 bg-red-50 p-6 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-white p-6 text-sm text-muted">
            아직 등록된 댓글이 없습니다.
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-lg border border-line bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-gray-950">{comment.authorName}</p>
                  <p className="mt-1 text-xs text-muted">{formatCommentDate(comment.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="password"
                    value={deletePasswords[comment.id] ?? ''}
                    placeholder="비밀번호"
                    className="h-10 w-32 px-3 py-2"
                    onChange={(event) =>
                      setDeletePasswords((currentPasswords) => ({
                        ...currentPasswords,
                        [comment.id]: event.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={deletingId === comment.id}
                    onClick={() => void handleDelete(comment.id)}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    삭제
                  </Button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
