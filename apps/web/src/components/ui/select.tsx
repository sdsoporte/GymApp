import { cn } from '@/lib/utils';
import { type SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, children, ...props }, ref) => (
    <label className="block space-y-1">
      {label ? <span className="text-xs text-zinc-400">{label}</span> : null}
      <select
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  )
);
Select.displayName = 'Select';
