import type { ReactNode } from 'react';
import { Card } from './Card';

export function SidebarPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="rounded-[24px] p-5 md:p-6">
      <h3 className="text-lg font-black text-gray-950">{title}</h3>
      <div className="mt-4">{children}</div>
    </Card>
  );
}
