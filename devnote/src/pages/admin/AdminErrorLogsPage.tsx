import { AlertTriangle, Clock3, Loader2, SearchX, ServerCrash } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { getErrorLogDetail, getErrorLogs } from '../../api/errorLogs';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import type { ErrorLogDetail, ErrorLogSummary } from '../../types';

export function AdminErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLogSummary[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ErrorLogDetail | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadLogs() {
      setIsLoadingList(true);
      setListError(null);
      try {
        const nextLogs = await getErrorLogs();
        if (!cancelled) {
          setLogs(nextLogs);
          setSelectedId((current) => current ?? nextLogs[0]?.id ?? null);
        }
      } catch (error) {
        if (!cancelled) {
          setListError(error instanceof Error ? error.message : '에러 로그 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingList(false);
        }
      }
    }

    void loadLogs();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (selectedId === null) {
      return;
    }

    let cancelled = false;
    const detailId = selectedId;

    async function loadDetail() {
      setIsLoadingDetail(true);
      setDetailError(null);
      try {
        const nextDetail = await getErrorLogDetail(detailId);
        if (!cancelled) {
          setDetail(nextDetail);
        }
      } catch (error) {
        if (!cancelled) {
          setDetail(null);
          setDetailError(error instanceof Error ? error.message : '에러 로그 상세를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDetail(false);
        }
      }
    }

    void loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedSummary = useMemo(
    () => logs.find((log) => log.id === selectedId) ?? null,
    [logs, selectedId],
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-line bg-white p-6 shadow-[0_18px_50px_rgba(17,24,39,0.05)] md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-500">
              <ServerCrash className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-500">Error Logs</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-gray-950">에러 로그</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-line bg-gray-50 px-4 py-3 text-sm font-bold text-gray-600">
            <Clock3 className="h-4 w-4 text-primary" />
            최근 {logs.length}건
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,440px)_1fr]">
        <Card className="overflow-hidden rounded-[24px]">
          <div className="border-b border-line p-5">
            <p className="text-sm font-bold text-gray-500">5xx Failures</p>
            <h3 className="mt-1 text-xl font-black text-gray-950">에러 목록</h3>
          </div>

          {isLoadingList ? (
            <StateBlock icon={<Loader2 className="h-5 w-5 animate-spin" />} text="에러 로그를 불러오는 중입니다." />
          ) : listError ? (
            <StateBlock icon={<AlertTriangle className="h-5 w-5" />} text={listError} tone="error" />
          ) : logs.length === 0 ? (
            <StateBlock icon={<SearchX className="h-5 w-5" />} text="기록된 서버 에러가 없습니다." />
          ) : (
            <div className="max-h-[720px] divide-y divide-line overflow-y-auto">
              {logs.map((log) => (
                <button
                  key={log.id}
                  type="button"
                  className={`block w-full px-5 py-4 text-left transition hover:bg-gray-50 ${
                    selectedId === log.id ? 'bg-red-50/70' : 'bg-white'
                  }`}
                  onClick={() => setSelectedId(log.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge tone="red">{log.status}</Badge>
                        <span className="text-xs font-bold text-gray-400">{formatDateTime(log.occurredAt)}</span>
                      </div>
                      <p className="mt-3 truncate text-sm font-black text-gray-950">
                        {log.method} {log.path}
                      </p>
                      <p className="mt-1 truncate text-xs font-semibold text-muted">
                        {log.exceptionType ?? '응답 상태 기반 기록'}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-gray-400">{log.durationMs}ms</span>
                  </div>
                  {log.message ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-red-700">{log.message}</p> : null}
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="rounded-[24px] p-6">
          <div className="flex flex-col gap-3 border-b border-line pb-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-bold text-gray-500">Detail</p>
              <h3 className="mt-1 text-xl font-black text-gray-950">상세 내역</h3>
            </div>
            {selectedSummary ? <Badge tone="red">{selectedSummary.status}</Badge> : null}
          </div>

          {isLoadingDetail ? (
            <StateBlock icon={<Loader2 className="h-5 w-5 animate-spin" />} text="상세 내역을 불러오는 중입니다." />
          ) : detailError ? (
            <StateBlock icon={<AlertTriangle className="h-5 w-5" />} text={detailError} tone="error" />
          ) : selectedId !== null && detail ? (
            <div className="mt-5 space-y-5">
              <div className="grid gap-3 md:grid-cols-2">
                <DetailField label="발생 시각" value={formatDateTime(detail.occurredAt)} />
                <DetailField label="처리 시간" value={`${detail.durationMs}ms`} />
                <DetailField label="요청" value={`${detail.method} ${detail.path}`} />
                <DetailField label="쿼리" value={detail.queryString ?? '-'} />
                <DetailField label="예외 타입" value={detail.exceptionType ?? '응답 상태 기반 기록'} />
                <DetailField label="클라이언트 IP" value={detail.clientIp ?? '-'} />
                <DetailField label="User Agent" value={detail.userAgent ?? '-'} wide />
                <DetailField label="메시지" value={detail.message ?? '-'} wide />
              </div>

              <div>
                <p className="text-sm font-black text-gray-950">실제 에러 로그</p>
                <pre className="mt-3 max-h-[520px] overflow-auto rounded-2xl border border-line bg-gray-950 p-4 text-xs leading-6 text-gray-100">
                  {detail.stackTrace ?? '스택 트레이스가 없는 5xx 응답 기록입니다.'}
                </pre>
              </div>
            </div>
          ) : (
            <StateBlock icon={<SearchX className="h-5 w-5" />} text="왼쪽 목록에서 에러를 선택해 주세요." />
          )}
        </Card>
      </section>
    </div>
  );
}

function DetailField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={`rounded-xl border border-line bg-gray-50 p-4 ${wide ? 'md:col-span-2' : ''}`}>
      <p className="text-xs font-bold text-gray-400">{label}</p>
      <p className="mt-2 break-words text-sm font-bold text-gray-900">{value}</p>
    </div>
  );
}

function StateBlock({ icon, text, tone = 'default' }: { icon: ReactNode; text: string; tone?: 'default' | 'error' }) {
  return (
    <div className={`flex items-center gap-3 p-6 text-sm font-bold ${tone === 'error' ? 'text-red-600' : 'text-muted'}`}>
      {icon}
      {text}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
