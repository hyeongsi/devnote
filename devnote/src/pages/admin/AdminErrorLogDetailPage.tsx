import { ArrowLeft, Clock3, Loader2, ServerCrash } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { getErrorLogDetail } from '../../api/errorLogs';
import type { ErrorLogDetail } from '../../types';

export function AdminErrorLogDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const [detail, setDetail] = useState<ErrorLogDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backLink = useMemo(
    () => ({
      pathname: '/admin/error-logs',
      search: location.search,
    }),
    [location.search],
  );

  useEffect(() => {
    if (!id) {
      setError('에러 로그 ID가 없습니다.');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setIsLoading(true);
      setError(null);

      try {
        const nextDetail = await getErrorLogDetail(Number(id));

        if (!cancelled) {
          setDetail(nextDetail);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDetail(null);
          setError(
            loadError instanceof Error
              ? loadError.message
              : '에러 로그 상세를 불러오는 중 문제가 발생했습니다.',
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="space-y-5">
      <section className="border-b border-line pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-muted">에러 로그 상세</p>
            <h2 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-gray-950">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
                <ServerCrash className="h-6 w-6" />
              </span>
              에러 로그 직접 확인
            </h2>
          </div>
          <Link
            to={backLink}
            className="inline-flex items-center justify-center rounded-[10px] border border-line bg-white px-5 py-3 text-sm font-bold text-gray-900 transition hover:-translate-y-0.5"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Link>
        </div>
      </section>

      {isLoading ? (
        <div className="rounded-lg border border-line bg-white px-6 py-14 text-center text-sm font-semibold text-muted">
          <Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin" />
          에러 로그 상세를 불러오는 중입니다.
        </div>
      ) : error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-6 py-12 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : detail ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DetailField label="상태 코드" value={String(detail.status)} accent="danger" />
            <DetailField label="HTTP 메서드" value={detail.method} />
            <DetailField
              label="처리 시간"
              value={`${detail.durationMs}ms`}
              icon={<Clock3 className="h-4 w-4" />}
            />
            <DetailField label="발생 시각" value={formatDateTime(detail.occurredAt)} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-lg border border-line bg-white p-6 shadow-[0_12px_36px_rgba(17,24,39,0.04)]">
              <h3 className="text-xl font-black text-gray-950">실제 에러 로그</h3>
              <pre className="mt-4 max-h-[720px] overflow-auto rounded-2xl border border-line bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                {detail.stackTrace ?? '스택 트레이스가 없는 5xx 응답 기록입니다.'}
              </pre>
            </div>

            <div className="space-y-4">
              <section className="rounded-lg border border-line bg-white p-6 shadow-[0_12px_36px_rgba(17,24,39,0.04)]">
                <h3 className="text-xl font-black text-gray-950">요청 정보</h3>
                <div className="mt-4 space-y-3">
                  <DetailRow label="경로" value={detail.path} />
                  <DetailRow label="쿼리" value={detail.queryString ?? '-'} />
                  <DetailRow label="예외 타입" value={detail.exceptionType ?? '응답 상태 기반 기록'} />
                  <DetailRow label="메시지" value={detail.message ?? '-'} />
                </div>
              </section>

              <section className="rounded-lg border border-line bg-white p-6 shadow-[0_12px_36px_rgba(17,24,39,0.04)]">
                <h3 className="text-xl font-black text-gray-950">클라이언트 정보</h3>
                <div className="mt-4 space-y-3">
                  <DetailRow label="IP" value={detail.clientIp ?? '-'} />
                  <DetailRow label="User Agent" value={detail.userAgent ?? '-'} />
                </div>
              </section>
            </div>
          </section>
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-line bg-white px-6 py-14 text-center text-sm font-semibold text-muted">
          선택한 에러 로그를 찾을 수 없습니다.
        </p>
      )}
    </div>
  );
}

function DetailField({
  label,
  value,
  icon,
  accent = 'default',
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  accent?: 'default' | 'danger';
}) {
  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-[0_12px_36px_rgba(17,24,39,0.04)]">
      <p className="text-xs font-bold text-gray-400">{label}</p>
      <p
        className={`mt-3 flex items-center gap-2 text-base font-black ${
          accent === 'danger' ? 'text-red-600' : 'text-gray-900'
        }`}
      >
        {icon}
        {value}
      </p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-gray-50 p-4">
      <p className="text-xs font-bold text-gray-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value));
}
