import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#DCEEFF] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50 shadow-sm hover:scale-[1.02] active:scale-[0.98]',
          {
            'bg-[#0064FF] text-white hover:bg-[#0055DD]': variant === 'primary',
            'bg-[#0F1E32] text-white hover:bg-[#1A2D45]': variant === 'secondary',
            'text-[#5F6E82] shadow-none hover:bg-[#F6F9FC] hover:text-[#0F1E32]': variant === 'ghost',
            'border border-[#D6DEE8] bg-white text-[#0F1E32] shadow-md hover:bg-[#F6F9FC]': variant === 'outline',
          },
          {
            'h-10 rounded-2xl px-4 text-xs': size === 'sm',
            'h-12 rounded-2xl px-6 py-2 text-sm': size === 'md',
            'h-14 rounded-2xl px-8 text-base': size === 'lg',
          },
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
