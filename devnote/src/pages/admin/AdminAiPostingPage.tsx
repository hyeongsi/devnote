import { Lightbulb, PenSquare, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';

const tips = [
  '구체적인 주제를 입력할수록 더 또렷한 초안 구조를 잡기 좋습니다.',
  '톤과 스타일은 실제 블로그 독자층에 맞춰 선택하는 것이 좋습니다.',
  '추가 지시사항에는 꼭 들어가야 할 키워드나 제외할 내용을 적어두면 됩니다.',
];

export function AdminAiPostingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_20px_60px_rgba(17,24,39,0.05)] md:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-bold text-primary">AI 자동 포스팅</p>
          <h2 className="mt-3 text-4xl font-black tracking-tight text-gray-950">
            AI 글 생성 및 관리
          </h2>
          <p className="mt-3 text-lg text-muted">
            AI를 활용하여 새로운 블로그 글 초안을 생성하는 화면입니다. 현재는 기능 없이
            화면과 이동 흐름만 구성되어 있습니다.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="rounded-[28px] p-6 md:p-8">
          <div className="border-b border-line pb-5">
            <p className="text-sm font-bold text-primary">글 생성</p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-950">새 글 생성</h3>
          </div>

          <div className="mt-6 grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700">주제 키워드</span>
              <Input placeholder="예: Spring Boot AI 자동화" />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">카테고리</span>
                <Select defaultValue="ai">
                  <option value="ai">AI 자동화</option>
                  <option value="spring">Spring Boot</option>
                  <option value="devops">DevOps</option>
                </Select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-semibold text-gray-700">톤 & 스타일</span>
                <Select defaultValue="technical">
                  <option value="technical">전문적이고 기술적인</option>
                  <option value="friendly">친근하고 설명적인</option>
                  <option value="brief">짧고 요약형</option>
                </Select>
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-gray-700">추가 지시사항</span>
              <Textarea
                placeholder="예: 실무 예시와 구성 단계를 포함하고, 초보자도 이해하기 쉬운 흐름으로 작성"
                className="min-h-40"
              />
            </label>

            <div className="flex justify-end pt-2">
              <Button type="button" className="min-w-44 gap-2">
                <Sparkles className="h-4 w-4" />
                AI 글 생성하기
              </Button>
            </div>
          </div>
        </Card>

        <Card className="rounded-[28px] p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Lightbulb className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-primary">생성 팁</p>
              <h3 className="text-lg font-black text-gray-950">입력 가이드</h3>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {tips.map((tip, index) => (
              <div key={tip} className="rounded-2xl border border-line bg-[#fbfbff] p-4">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-black text-primary">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6 text-gray-600">{tip}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary-soft/50 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <PenSquare className="h-4 w-4" />
              현재 상태
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              이 화면은 디자인과 이동 경로만 연결된 상태입니다. 저장, 생성, 목록 반영 같은 기능은
              아직 붙어 있지 않습니다.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
