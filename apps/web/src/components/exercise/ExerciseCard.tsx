import { Link } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageOff } from 'lucide-react';

interface Exercise {
  slug: string;
  name: string;
  nameEs: string | null;
  bodyPart: string | null;
  muscleGroup: string | null;
  equipment: string | null;
  target: string | null;
  imageUrl: string | null;
}

function assetUrl(path: string | null) {
  if (!path) return '';
  const base = import.meta.env.VITE_ASSETS_URL || '/assets/exercises';
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link to="/catalog/$slug" params={{ slug: exercise.slug }} data-testid="catalog-result">
      <Card className="flex gap-4 overflow-hidden transition-colors hover:border-[var(--color-primary)]">
        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center bg-[var(--color-muted)]">
          {exercise.imageUrl ? (
            <img
              src={assetUrl(exercise.imageUrl)}
              alt={exercise.nameEs || exercise.name}
              loading="lazy"
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.classList.add('flex');
              }}
            />
          ) : (
            <ImageOff className="h-8 w-8 text-zinc-500" />
          )}
        </div>
        <CardContent className="flex flex-1 flex-col justify-center py-3 pr-3">
          <h3 className="line-clamp-1 font-semibold">{exercise.nameEs || exercise.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1">
            {exercise.bodyPart ? <Badge>{exercise.bodyPart}</Badge> : null}
            {exercise.equipment ? <Badge>{exercise.equipment}</Badge> : null}
            {exercise.target ? <Badge>{exercise.target}</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
