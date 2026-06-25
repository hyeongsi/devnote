import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Filter,
  RefreshCcw,
  Search,
  ServerCrash,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getErrorLogs } from '../../api/errorLogs';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { usePagination } from '../../hooks/usePagination';
import type { ErrorLogSearchParams, ErrorLogSummary } from '../../types';

const LOGS_PER_PAGE = 9;
const STATUS_OPTIONS = ['500', '501', '502', '503', '504'];
const METHOD_OPTIONS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const EMPTY_FILTERS: ErrorLogSearchParams = {
  keyword: '',
  status: '',
  method: '',
  from: '',
  to: '',
};

export function AdminErrorLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [draftFilters, setDraftFilters] = useState<ErrorLogSearchParams>(() =>
    filtersFromSearchParams(searchParams),
  );
  const [logs, setLogs] = useState<ErrorLogSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setIsLoading(true);
      setError(null);

      try {
        const nextLogs = await getErrorLogs(filters);

        if (!cancelled) {
          setLogs(nextLogs);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : '에러 로그 목록을 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLogs();

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const {
    currentPage,
    setCurrentPage,
    totalItems,
    totalPages,
    paginatedItems,
    paginationItems,
  } = usePagination({
    items: logs,
    itemsPerPage: LOGS_PER_PAGE,
    resetKey: JSON.stringify(filters),
  });

  function updateDraft(field: keyof ErrorLogSearchParams, value: string) {
    setDraftFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (draftFilters.from && draftFilters.to && draftFilters.from > draftFilters.to) {
      setValidationError('기간 시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }

    setValidationError(null);
    setSearchParams(buildSearchParams(draftFilters));
  }

  function handleReset() {
    setValidationError(null);
    setDraftFilters(EMPTY_FILTERS);
    setSearchParams(new URLSearchParams());
  }

  return (
    <div className="space-y-5">
      <section className="border-b border-line pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">
              총 {logs.length.toLocaleString('ko-KR')}개의 에러 로그
            </p>
            <h2 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-gray-950">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
                <ServerCrash className="h-6 w-6" />
              </span>
              에러 로그 관리
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm font-bold text-gray-600">
            <Clock3 className="h-4 w-4 text-primary" />
            최근 조회 {logs.length}건
          </div>
        </div>
      </section>

      <form className="space-y-3 border-b border-line pb-5" onSubmit={handleSearchSubmit}>
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1.2fr)_180px_180px_180px_180px]">
          <div className="relative">
            <Input
              value={draftFilters.keyword ?? ''}
              onChange={(event) => updateDraft('keyword', event.target.value)}
              placeholder="path, 메시지, 예외 타입 검색"
              className="pr-11"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
          <Select
            value={draftFilters.status ?? ''}
            onChange={(event) => updateDraft('status', event.target.value)}
            aria-label="상태 코드 필터"
          >
            <option value="">전체 상태코드</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
          <Select
            value={draftFilters.method ?? ''}
            onChange={(event) => updateDraft('method', event.target.value)}
            aria-label="HTTP 메서드 필터"
          >
            <option value="">전체 메서드</option>
            {METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </Select>
          <Input
            type="date"
            value={draftFilters.from ?? ''}
            onChange={(event) => updateDraft('from', event.target.value)}
            aria-label="기간 시작일"
          />
          <Input
            type="date"
            value={draftFilters.to ?? ''}
            onChange={(event) => updateDraft('to', event.target.value)}
            aria-label="기간 종료일"
          />
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
            <Filter className="h-4 w-4" />
            검색 결과 {totalItems.toLocaleString('ko-KR')}건
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              <Search className="mr-2 h-4 w-4" />
              검색
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              초기화
            </Button>
          </div>
        </div>

        {validationError ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {validationError}
          </p>
        ) : null}
      </form>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-[260px] animate-pulse rounded-lg border border-line bg-white"
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
            {paginatedItems.map((log) => (
              <Link
                key={log.id}
                to={{
                  pathname: `/admin/error-logs/${log.id}`,
                  search: searchParams.size > 0 ? `?${searchParams.toString()}` : '',
                }}
                className="group flex min-h-[260px] flex-col rounded-lg border border-line bg-white p-5 shadow-[0_12px_36px_rgba(17,24,39,0.04)] transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_16px_40px_rgba(239,68,68,0.08)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {log.status}
                  </div>
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {log.method}
                  </span>
                </div>

                <h3 className="mt-4 line-clamp-2 text-lg font-black leading-7 text-gray-950">
                  {log.path}
                </h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">
                  {log.exceptionType ?? '응답 상태 기반 기록'}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                  {log.message ?? '메시지 없이 기록된 서버 에러입니다.'}
                </p>

                <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-line pt-4 text-xs text-gray-500">
                  <div>
                    <dt className="flex items-center gap-1 font-semibold">
                      <CalendarDays className="h-3.5 w-3.5" />
                      발생 시각
                    </dt>
                    <dd className="mt-1 font-bold text-gray-700">{formatDateTime(log.occurredAt)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1 font-semibold">
                      <Clock3 className="h-3.5 w-3.5" />
                      처리 시간
                    </dt>
                    <dd className="mt-1 font-bold text-gray-700">{log.durationMs}ms</dd>
                  </div>
                </dl>
              </Link>
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
          조건에 맞는 에러 로그가 없습니다.
        </p>
      )}
    </div>
  );
}

function filtersFromSearchParams(searchParams: URLSearchParams): ErrorLogSearchParams {
  return {
    keyword: searchParams.get('keyword') ?? '',
    status: searchParams.get('status') ?? '',
    method: searchParams.get('method') ?? '',
    from: searchParams.get('from') ?? '',
    to: searchParams.get('to') ?? '',
  };
}

function buildSearchParams(filters: ErrorLogSearchParams) {
  const nextParams = new URLSearchParams();

  for (const [key, value] of Object.entries(filters)) {
    if (value) {
      nextParams.set(key, value);
    }
  }

  return nextParams;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
