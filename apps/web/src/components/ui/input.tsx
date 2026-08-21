import { cn } from '@/lib/utils';
import { forwardRef, type InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, ...props }, ref) => (
    <label className="block space-y-1">
      {label ? <span className="text-xs text-zinc-400">{label}</span> : null}
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50',
          className
        )}
        {...props}
      />
    </label>
  )
);
Input.displayName = 'Input';
