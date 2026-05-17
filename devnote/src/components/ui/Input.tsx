import type { InputHTMLAttributes } from 'react';

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft ${className}`}
      {...props}
    />
  );
}
