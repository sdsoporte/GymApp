import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';
