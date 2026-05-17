import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'dark' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'gradient-primary text-white shadow-[0_12px_24px_rgba(109,93,252,0.22)]',
  dark: 'bg-dark text-white shadow-[0_10px_20px_rgba(0,0,0,0.16)]',
  outline: 'border border-line bg-white text-gray-900',
  ghost: 'text-gray-600 hover:text-primary',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-2.5 text-sm',
  md: 'px-5 py-3 text-sm',
  lg: 'px-7 py-4 text-base',
};

export function Button({ children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-[10px] font-bold transition hover:-translate-y-0.5 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
