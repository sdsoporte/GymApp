import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SetLogger } from '@/components/session/SetLogger';
import { Loader2, Trophy } from 'lucide-react';

export const Route = createFileRoute('/train/$sessionId')({
  component: TrainSessionPage,
});

function TrainSessionPage() {
  const { sessionId } = Route.useParams();
  const navigate = useNavigate();
  const detail = trpc.sessions.byId.useQuery({ id: sessionId });
  const logSet = trpc.sessions.logSet.useMutation();
  const deleteSet = trpc.sessions.deleteSet.useMutation();
  const complete = trpc.sessions.complete.useMutation();
  const [error, setError] = useState<string | null>(null);

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
          No se pudo cargar la sesión.
          <Button className="mt-4 w-full" variant="outline" onClick={() => navigate({ to: '/routines' })}>
            Volver a rutinas
          </Button>
        </CardContent>
      </Card>
    );
  }

  const session = detail.data;
  const isCompleted = !!session.completedAt;

  const handleLog = async (input: {
    exerciseId: string;
    setNumber: number;
    reps: number;
    weightKg: number;
    rpe?: number;
    restSeconds?: number;
  }) => {
    setError(null);
    try {
      await logSet.mutateAsync({ sessionId, ...input });
      await detail.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar la serie';
      setError(message);
    }
  };

  const handleDelete = async (setId: string) => {
    if (!confirm('¿Eliminar esta serie?')) return;
    setError(null);
    try {
      await deleteSet.mutateAsync({ sessionId, id: setId });
      await detail.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar la serie';
      setError(message);
    }
  };

  const handleComplete = async () => {
    setError(null);
    try {
      await complete.mutateAsync({ id: sessionId });
      await detail.refetch();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al completar la sesión';
      setError(message);
    }
  };

  if (isCompleted) {
    return (
      <div className="space-y-4">
        <Card className="border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <Trophy className="h-10 w-10 text-[var(--color-primary)]" />
            <h1 className="text-xl font-bold">Sesión completada</h1>
            <p className="text-sm text-zinc-300">
              {session.exercises.reduce((sum, e) => sum + e.sets.length, 0)} series registradas
            </p>
          </CardContent>
        </Card>
        {session.exercises.map((exercise) => (
          <Card key={exercise.exerciseId}>
            <CardContent className="p-3">
              <p className="font-medium">{exercise.nameEs || exercise.name}</p>
              <div className="mt-2 space-y-1">
                {exercise.sets.map((set) => (
                  <p key={set.id} className="text-sm text-zinc-400">
                    Serie {set.setNumber}: {set.weightKg}kg × {set.reps}
                    {set.rpe ? ` @RPE ${set.rpe}` : ''}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        <Button className="w-full" onClick={() => navigate({ to: '/routines' })}>
          Volver a rutinas
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Sesión activa</h1>
        <Button size="sm" variant="outline" onClick={handleComplete} disabled={complete.isPending}>
          {complete.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Finalizar
        </Button>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {session.exercises.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-zinc-400">
            Esta sesión no tiene ejercicios. Finalizala para guardarla en el historial.
            <Button className="mt-4 w-full" onClick={handleComplete}>
              Finalizar sesión
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {session.exercises.map((exercise) => (
            <SetLogger
              key={exercise.exerciseId}
              sessionId={sessionId}
              exercise={exercise}
              sets={exercise.sets}
              onLog={handleLog}
              onDelete={handleDelete}
              isPending={logSet.isPending || deleteSet.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
