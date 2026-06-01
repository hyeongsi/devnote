import type { FormEvent } from 'react';
import { ArrowRight, Loader2, Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { searchPosts } from '../../api/posts';
import { getSearchCommandPath, shouldSearchPosts } from '../../features/searchCommands';
import type { BlogPostSearchResult } from '../../types';

interface PostSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function PostSearchDialog({ open, onClose }: PostSearchDialogProps) {
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BlogPostSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose, open]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!open || !shouldSearchPosts(trimmedQuery)) {
      return;
    }

    let ignore = false;

    const timer = window.setTimeout(() => {
      searchPosts(trimmedQuery)
        .then((nextResults) => {
          if (!ignore) {
            setResults(nextResults);
          }
        })
        .catch(() => {
          if (!ignore) {
            setResults([]);
            setError('검색 결과를 불러오지 못했습니다.');
          }
        })
        .finally(() => {
          if (!ignore) {
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [open, query]);

  if (!open) {
    return null;
  }

  const hasQuery = query.trim().length >= 2;

  const handleQueryChange = (value: string) => {
    setQuery(value);

    if (!shouldSearchPosts(value)) {
      setResults([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const commandPath = getSearchCommandPath(query);
    if (commandPath) {
      navigate(commandPath);
      onClose();
    }
  };

  const openPost = (post: BlogPostSearchResult) => {
    navigate(`/posts/${post.categorySlug}/${post.slug}`);
    onClose();
  };

  return createPortal(
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="게시글 검색"
        className="fixed left-1/2 top-24 z-40 w-[calc(100%-32px)] max-w-2xl -translate-x-1/2 overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[0_24px_80px_rgba(17,24,39,0.22)] md:top-28"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            onClose();
          }
        }}
      >
        <form className="flex items-center gap-3 border-b border-line px-4 py-3 md:px-5" onSubmit={handleSubmit}>
          <Search className="h-5 w-5 shrink-0 text-primary" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="검색어를 입력하세요"
            className="min-w-0 flex-1 border-0 bg-transparent py-2 text-base font-semibold text-gray-950 outline-none placeholder:text-gray-400"
          />
          <kbd className="hidden rounded-md border border-line bg-gray-50 px-2 py-1 text-xs font-black text-gray-500 sm:inline">
            Ctrl + K
          </kbd>
          <button
            type="button"
            aria-label="검색 닫기"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </form>

        <div className="max-h-[min(70vh,560px)] overflow-y-auto p-3 md:p-4">
          {!hasQuery ? (
            <div className="px-3 py-10 text-center text-sm font-semibold text-gray-500">
              두 글자 이상 입력하면 게시글 제목과 본문을 검색합니다.
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-10 text-sm font-semibold text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              검색 중
            </div>
          ) : error ? (
            <div className="px-3 py-10 text-center text-sm font-semibold text-red-500">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm font-semibold text-gray-500">검색 결과가 없습니다.</div>
          ) : (
            <div className="space-y-2">
              {results.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="group grid w-full grid-cols-[1fr_auto] gap-4 rounded-[12px] border border-transparent px-4 py-3 text-left transition hover:border-line hover:bg-gray-50"
                  onClick={() => openPost(post)}
                >
                  <span className="min-w-0">
                    <span className="mb-1 flex flex-wrap items-center gap-2 text-xs font-bold text-primary">
                      <span>{post.category}</span>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-500">{post.displayDate}</span>
                    </span>
                    <span className="block truncate text-base font-black text-gray-950">{post.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm leading-6 text-gray-600">{post.matchedText}</span>
                  </span>
                  <span className="mt-7 rounded-full bg-primary-soft p-2 text-primary transition group-hover:bg-primary group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>,
    document.body,
  );
}
