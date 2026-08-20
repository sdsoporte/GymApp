import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { GifImage } from '@/components/exercise/GifImage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2, SearchX } from 'lucide-react';

export const Route = createFileRoute('/catalog/$slug')({
  component: DetailPage,
});

function DetailPage() {
  const { slug } = Route.useParams();
  const detail = trpc.catalog.detail.useQuery({ slug });
  const navigate = useNavigate();

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <SearchX className="h-12 w-12 text-zinc-500" />
        <h1 className="text-xl font-semibold">Ejercicio no encontrado</h1>
        <Button variant="outline" onClick={() => navigate({ to: '/catalog' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al catálogo
        </Button>
      </div>
    );
  }

  const exercise = detail.data;

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate({ to: '/catalog' })}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <GifImage
        src={exercise.gifUrl}
        alt={exercise.nameEs || exercise.name}
        className="aspect-video w-full"
      />

      <div>
        <h1 className="text-2xl font-bold">{exercise.nameEs || exercise.name}</h1>
        <p className="text-sm text-zinc-500">{exercise.name}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {exercise.bodyPart ? <Badge>{exercise.bodyPart}</Badge> : null}
        {exercise.muscleGroup ? <Badge>{exercise.muscleGroup}</Badge> : null}
        {exercise.equipment ? <Badge>{exercise.equipment}</Badge> : null}
        {exercise.target ? <Badge>{exercise.target}</Badge> : null}
      </div>

      {exercise.instructionsEs ? (
        <Card>
          <CardContent>
            <h2 className="mb-2 font-semibold">Instrucciones</h2>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-zinc-300">
              {exercise.instructionsEs.split('\n').map((step, i) =>
                step.trim() ? <li key={i}>{step.trim()}</li> : null
              )}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {exercise.attribution ? (
        <p className="text-center text-xs text-zinc-500">
          © {exercise.attribution}
        </p>
      ) : (
        <p className="text-center text-xs text-zinc-500">© Gym visual</p>
      )}
    </div>
  );
}
