import { Clock3, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';

const topics = ['콘텐츠 제안', '기술 질문', '오류 제보', '협업'];

export function ContactPage() {
  return (
    <>
      <section className="border-b border-slate-200 bg-[#eef0f5] px-5 py-16 text-center md:px-8 xl:px-12">
        <h1 className="text-4xl font-black text-gray-950 md:text-5xl">궁금한 점이나 제안이 있다면</h1>
        <p className="mt-5 text-lg text-gray-600">
          콘텐츠 제안, 기술 문의, 협업 이야기를 남겨주세요.
        </p>
      </section>

      <section className="grid gap-12 px-5 py-14 md:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.7fr)] xl:px-12">
        <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
          <h2 className="mb-2 text-2xl font-black text-gray-950">문의하기</h2>
          <FormField label="이름">
            <Input placeholder="이름을 입력해주세요" />
          </FormField>
          <FormField label="이메일">
            <Input type="email" placeholder="이메일을 입력해주세요" />
          </FormField>
          <FormField label="문의 유형">
            <Select defaultValue="">
              <option value="" disabled>선택해주세요</option>
              {topics.map((topic) => <option key={topic}>{topic}</option>)}
            </Select>
          </FormField>
          <FormField label="제목">
            <Input placeholder="제목을 입력해주세요" />
          </FormField>
          <FormField label="내용">
            <Textarea className="min-h-48" placeholder="문의 내용을 자세히 작성해주세요" />
          </FormField>
          <label className="flex items-start gap-3 text-sm text-gray-600">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-[#6d5dfc]" />
            답변을 위해 개인정보 수집에 동의합니다.
          </label>
          <Button type="button" variant="dark" className="w-full">
            문의 보내기
          </Button>
        </form>

        <aside className="border-line lg:border-l lg:pl-12">
          <InfoSection icon={Clock3} title="답변 안내">
            <strong className="block text-gray-950">평균 2~3일 이내</strong>
            <p className="mt-2 text-sm leading-7 text-muted">이메일로 답변드립니다.</p>
          </InfoSection>
          <InfoSection icon={Mail} title="연락처">
            <strong className="block text-gray-950">hello@devnote.dev</strong>
            <p className="mt-2 text-sm leading-7 text-muted">이메일 문의만 받고 있습니다.</p>
          </InfoSection>
          <div className="border-t border-line py-8">
            <h3 className="font-black text-gray-950">문의 가능한 주제</h3>
            <div className="mt-5 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span key={topic} className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-primary">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-gray-800">{label}</span>
      {children}
    </label>
  );
}

function InfoSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock3;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-line py-8 first:pt-0">
      <h3 className="font-black text-gray-950">{title}</h3>
      <span className="mt-5 grid h-10 w-10 place-items-center rounded-full bg-violet-50 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="mt-4">{children}</div>
    </div>
  );
}
