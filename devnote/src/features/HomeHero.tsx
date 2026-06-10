import { CircleCheck, Clock3, Code2, Eye, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const recentPosts = [
  'AI 자동 포스팅 시스템 구축기',
  'Spring Boot 3.x 예외 처리 정리',
  'Docker로 개발 환경 구성하기',
];

export function HomeHero() {
  const navigate = useNavigate();

  return (
    <section className="section border-b border-slate-200 bg-[#eef0f5] pb-10 pt-12 md:pt-16">
      <div className="grid items-center gap-10 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="max-w-xl">
          <h1 className="text-[44px] font-black leading-[1.16] text-gray-950 sm:text-[58px] lg:text-[64px]">
            AI로 자동화하는
            <br />
            개발 블로그
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted md:text-xl">
            개발, 자동화, AI에 대한 인사이트와
            <br className="hidden sm:block" /> 경험을 기록합니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="dark" onClick={() => navigate('/posts')}>
              최신 글 보러가기
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document
                  .getElementById('popular-posts')
                  ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            >
              인기 글 보기
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-700 bg-[#15181e] shadow-[0_24px_70px_rgba(17,24,39,0.18)]">
          <div className="flex h-10 items-center gap-2 border-b border-white/10 px-4">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </div>

          <div className="grid min-h-[390px] lg:grid-cols-[minmax(0,1.6fr)_minmax(240px,0.9fr)]">
            <div className="hidden border-r border-white/10 bg-[#101319] sm:grid sm:grid-cols-[120px_minmax(0,1fr)]">
              <div className="border-r border-white/10 p-4 text-[11px] leading-7 text-gray-500">
                <p className="font-semibold text-gray-300">auto-posting</p>
                <p className="mt-2">app</p>
                <p className="pl-2 text-gray-400">scheduler.py</p>
                <p className="pl-2 text-gray-400">generator.py</p>
                <p className="pl-2 text-gray-400">publisher.py</p>
                <p className="mt-2">config</p>
                <p className="pl-2 text-gray-400">settings.py</p>
              </div>
              <div className="min-w-0">
                <div className="flex h-10 items-center border-b border-white/10 px-4 text-xs text-gray-300">
                  auto_post.py
                </div>
                <pre className="overflow-hidden px-5 py-4 text-[11px] leading-6 text-gray-400">
                  <code>{`1  import openai
2  import schedule

4  def generate_post(topic: str):
5      prompt = f"""
6      당신은 개발 블로거입니다.
7      주제에 맞는 기술 블로그 글을
8      작성해 주세요.
9      """
10
11     response = client.chat.completions.create(
12         model="gpt-4o-mini",
13         messages=[{"role": "user",
14                    "content": prompt}]
15     )
16     return response.choices[0].message.content

18 def job():
19     content = generate_post(get_topic())
20     publish(content)`}</code>
                </pre>
              </div>
            </div>

            <div className="bg-[#20242b] p-4 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold">자동 포스팅 대시보드</h2>
                <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                  <CircleCheck className="h-3 w-3" />
                  정상 실행 중
                </span>
              </div>

              <div className="mt-4 rounded-md bg-white p-4 text-gray-900">
                <p className="text-xs text-gray-500">다음 실행 시간</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                  <Clock3 className="h-4 w-4 text-primary" />
                  2026-06-10 09:00
                </p>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <DashboardMetric icon={FileText} label="총 발행 글" value="156" />
                <DashboardMetric icon={Eye} label="총 조회수" value="12,548" />
              </div>

              <div className="mt-3 rounded-md bg-white p-4 text-gray-900">
                <p className="text-xs font-semibold">최근 발행 글</p>
                <div className="mt-3 space-y-3">
                  {recentPosts.map((post) => (
                    <div key={post} className="flex items-start gap-2 text-[10px] text-gray-600">
                      <CircleCheck className="mt-0.5 h-3 w-3 shrink-0 text-emerald-500" />
                      <span className="line-clamp-1">{post}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Code2;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md bg-white p-3 text-gray-900">
      <p className="flex items-center gap-1.5 text-[10px] text-gray-500">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {label}
      </p>
      <strong className="mt-2 block text-xl font-black">{value}</strong>
    </div>
  );
}
