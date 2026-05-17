import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  action?: ReactNode;
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-7 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h2>
      {action}
    </div>
  );
}
