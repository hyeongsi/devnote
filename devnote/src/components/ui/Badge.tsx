import type { ReactNode } from 'react';

type BadgeTone = 'default' | 'primary' | 'green' | 'red' | 'gray';

const toneClasses: Record<BadgeTone, string> = {
  default: 'border-line bg-white text-gray-600',
  primary: 'border-primary-soft bg-primary-soft text-primary',
  green: 'border-green-100 bg-green-100 text-emerald-600',
  red: 'border-red-100 bg-red-100 text-red-500',
  gray: 'border-slate-100 bg-slate-100 text-slate-500',
};

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-extrabold ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}
