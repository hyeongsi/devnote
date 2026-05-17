import { ArrowUpRight } from 'lucide-react';
import type { AdminStat } from '../../types';

const toneClasses: Record<AdminStat['tone'], string> = {
  violet: 'bg-violet-100 text-violet-600',
  green: 'bg-emerald-100 text-emerald-600',
  blue: 'bg-sky-100 text-sky-600',
  orange: 'bg-orange-100 text-orange-600',
  pink: 'bg-pink-100 text-pink-600',
};

export function AdminStatCard({ stat }: { stat: AdminStat }) {
  const Icon = stat.icon;

  return (
    <div className="rounded-[24px] border border-line bg-white p-6 shadow-[0_16px_50px_rgba(17,24,39,0.05)]">
      <div className="flex items-start justify-between">
        <div className={`grid h-14 w-14 place-items-center rounded-2xl ${toneClasses[stat.tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-3 py-1 text-xs font-bold text-emerald-600">
          <ArrowUpRight className="h-3.5 w-3.5" />
          {stat.change}
        </div>
      </div>
      <p className="mt-5 text-sm font-semibold text-gray-500">{stat.label}</p>
      <strong className="mt-1 block text-4xl font-black tracking-tight text-gray-950">{stat.value}</strong>
      <p className="mt-2 text-sm text-muted">지난 주 대비</p>
    </div>
  );
}
