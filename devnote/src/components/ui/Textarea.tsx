import type { TextareaHTMLAttributes } from 'react';

export function Textarea({ className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={`min-h-32 w-full resize-y rounded-xl border border-line bg-white px-4 py-3.5 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary-soft ${className}`}
      {...props}
    />
  );
}
