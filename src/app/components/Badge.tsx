import { type HTMLAttributes } from 'react';
import { cn } from '../lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'upcoming' | 'active' | 'ended' | 'recruiting' | 'submitted' | 'default';
}

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider',
        {
          'bg-[#EEF3F8] text-[#0F1E32]': variant === 'upcoming',
          'bg-blue-50 text-[#0064FF]': variant === 'active' || variant === 'recruiting',
          'bg-[#EEF3F8] text-[#5F6E82]': variant === 'ended',
          'bg-[#EEF0FF] text-[#4B5DFF]': variant === 'submitted',
          'border border-[#D6DEE8] bg-white text-[#0F1E32]': variant === 'default',
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
