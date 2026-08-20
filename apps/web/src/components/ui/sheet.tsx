import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { type ReactNode } from 'react';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-card)] p-4 md:left-auto md:right-0 md:top-0 md:max-h-none md:w-80 md:rounded-none md:border-l md:border-t-0">
        <div className="mb-4 flex items-center justify-between">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : <div />}
          <button onClick={onClose} className="rounded p-1 hover:bg-[var(--color-muted)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
