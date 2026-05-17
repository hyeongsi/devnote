import type { SelectHTMLAttributes } from 'react';

export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
