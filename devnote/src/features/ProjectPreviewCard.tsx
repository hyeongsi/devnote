import { Activity, Lock, Zap } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { TagList } from '../components/ui/TagList';
import type { ProjectPreview } from '../types';

const accents = {
  violet: 'from-[#9b90ff] to-[#6d5dfc]',
  indigo: 'from-[#5a4de7] to-[#342f90]',
  green: 'from-[#49d38b] to-[#1cad63]',
};

const icons = {
  zap: Zap,
  chart: Activity,
  lock: Lock,
};

export function ProjectPreviewCard({ project }: { project: ProjectPreview }) {
  const Icon = icons[project.icon];

  return (
    <Card className="rounded-[24px] p-6 shadow-[0_18px_50px_rgba(17,24,39,0.04)]">
      <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${accents[project.accent]} text-white shadow-[0_16px_34px_rgba(109,93,252,0.22)]`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-3xl font-black tracking-tight text-gray-950">{project.title}</h3>
      <p className="mt-3 text-base leading-7 text-muted">{project.description}</p>
      <div className="mt-5">
        <TagList tags={project.tags} />
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
        <span className="text-xl">◔</span>
        <span>{project.period}</span>
      </div>
    </Card>
  );
}
