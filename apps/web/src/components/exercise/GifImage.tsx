import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

function assetUrl(path: string | null) {
  if (!path) return '';
  const base = import.meta.env.VITE_ASSETS_URL || '/assets/exercises';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

interface GifImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export function GifImage({ src, alt, className }: GifImageProps) {
  const [error, setError] = useState(false);
  const url = assetUrl(src);

  if (!url || error) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] text-zinc-400',
          className
        )}
      >
        <ImageOff className="h-10 w-10" />
        <span className="text-sm">GIF no disponible</span>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className={cn('rounded-xl object-contain', className)}
      onError={() => setError(true)}
    />
  );
}
