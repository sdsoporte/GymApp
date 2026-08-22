import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, Clock, Dumbbell } from 'lucide-react';

export const Route = createFileRoute('/history/$id')({
  component: HistoryDetailPage,
});

function fmtDate(value: Date | string | null) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}

function HistoryDetailPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const detail = trpc.sessions.byId.useQuery({ id });

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-zinc-400">
          Sesión no encontrada.
          <Button className="mt-4 w-full" variant="outline" onClick={() => navigate({ to: '/history' })}>
            Volver al historial
          </Button>
        </CardContent>
      </Card>
    );
  }

  const session = detail.data;
  const totalSets = session.exercises.reduce((sum, e) => sum + e.sets.length, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate({ to: '/history' })}>Volver</Button>
      </div>
      <h1 className="text-2xl font-bold">Sesión del {fmtDate(session.completedAt)}</h1>
      <div className="flex flex-wrap gap-4 text-sm text-zinc-400">
        <span className="flex items-center gap-1"><Dumbbell className="h-4 w-4" />{session.routineId ? 'Rutina' : 'Entrenamiento libre'}</span>
        <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{fmtDate(session.completedAt)}</span>
        {session.startedAt && session.completedAt ? (
          <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{Math.ceil((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000)} min</span>
        ) : null}
        <span>{totalSets} series</span>
      </div>

      {session.exercises.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-zinc-400">Esta sesión no tiene series registradas.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {session.exercises.map((exercise) => (
            <Card key={exercise.exerciseId}>
              <CardContent className="p-4">
                <p className="font-semibold">{exercise.nameEs || exercise.name}</p>
                {exercise.sets.length ? (
                  <ul className="mt-2 space-y-1">
                    {exercise.sets.map((set) => (
                      <li key={set.id} className="text-sm text-zinc-400">
                        Serie {set.setNumber}: {set.weightKg}kg × {set.reps}{set.rpe ? ` @RPE ${set.rpe}` : ''}{set.notes ? ` — ${set.notes}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">Sin series registradas</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
