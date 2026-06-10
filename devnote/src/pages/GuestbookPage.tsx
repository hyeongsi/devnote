import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';

const entries = [
  {
    initial: 'J',
    tone: 'bg-violet-100 text-violet-700',
    name: 'jin_dev',
    date: '2026-06-10 10:21',
    message: '항상 도움 되는 글 감사합니다! 실무에 바로 적용할 수 있어서 정말 좋아요.',
  },
  {
    initial: 'S',
    tone: 'bg-blue-100 text-blue-700',
    name: 'spring_love',
    date: '2026-06-09 21:15',
    message: 'RAG 파이프라인 글 보고 구현해봤는데 구성이 깔끔해서 이해가 잘 됐어요.',
  },
  {
    initial: 'C',
    tone: 'bg-emerald-100 text-emerald-700',
    name: 'cloud_ops',
    date: '2026-06-09 14:35',
    message: '쿠버네티스 모니터링 관련 글 다음 주제도 기대됩니다!',
    reply: '관심 가져주셔서 감사합니다! 다음 글로 알림/대시보드 구성도 준비 중입니다.',
  },
  {
    initial: 'H',
    tone: 'bg-amber-100 text-amber-700',
    name: 'happy_coder',
    date: '2026-06-08 09:48',
    message: '자동 포스팅 기능 덕분에 꾸준히 글을 볼 수 있어 좋아요! 앞으로도 좋은 내용 부탁드립니다.',
  },
];

export function GuestbookPage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-[#eef0f5] px-5 py-14 text-center md:px-8 xl:px-12">
        <h1 className="text-4xl font-black text-gray-950 md:text-5xl">방명록</h1>
        <p className="mt-5 text-lg text-gray-600">
          DevNote에 대한 짧은 인사와 의견을 남겨주세요.
        </p>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <div className="rounded-lg border border-line bg-white p-5">
          <label className="grid max-w-sm gap-2">
            <span className="text-sm font-bold text-gray-700">닉네임 (선택)</span>
            <Input placeholder="닉네임을 입력해주세요" />
          </label>
          <Textarea className="mt-4 min-h-28" placeholder="따뜻한 한마디를 남겨주세요" />
          <div className="mt-3 flex justify-end">
            <Button type="button">등록</Button>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {entries.map((entry) => (
            <article key={`${entry.name}-${entry.date}`} className="rounded-lg border border-line bg-white p-5">
              <div className="grid grid-cols-[44px_1fr_auto] gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-full font-black ${entry.tone}`}>
                  {entry.initial}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <strong className="text-sm text-gray-950">{entry.name}</strong>
                    <span className="text-xs text-gray-400">{entry.date}</span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-gray-700">{entry.message}</p>
                  {entry.reply ? (
                    <div className="mt-4 rounded-lg border border-line bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-violet-100 font-black text-primary">D</span>
                        <strong className="text-sm text-gray-950">DevNote</strong>
                        <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-bold text-white">관리자</span>
                        <span className="text-xs text-gray-400">2026-06-09 15:02</span>
                      </div>
                      <p className="mt-3 pl-11 text-sm leading-7 text-gray-700">{entry.reply}</p>
                    </div>
                  ) : null}
                </div>
                <button type="button" className="h-9 rounded-md border border-line px-3 text-xs font-semibold text-gray-600 hover:border-primary hover:text-primary">
                  답글
                </button>
              </div>
            </article>
          ))}
        </div>

        <nav aria-label="방명록 페이지" className="mt-8 flex items-center justify-center gap-2">
          <PageButton ariaLabel="이전 페이지"><ChevronLeft className="h-4 w-4" /></PageButton>
          {[1, 2, 3, 4, 5].map((page) => (
            <button
              key={page}
              type="button"
              className={`h-9 w-9 rounded-md text-sm font-bold ${
                page === 1 ? 'bg-violet-50 text-primary ring-1 ring-violet-200' : 'text-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          <PageButton ariaLabel="다음 페이지"><ChevronRight className="h-4 w-4" /></PageButton>
        </nav>
      </section>
    </>
  );
}

function PageButton({ children, ariaLabel }: { children: React.ReactNode; ariaLabel: string }) {
  return (
    <button type="button" aria-label={ariaLabel} className="grid h-9 w-9 place-items-center rounded-md border border-line text-gray-500">
      {children}
    </button>
  );
}
