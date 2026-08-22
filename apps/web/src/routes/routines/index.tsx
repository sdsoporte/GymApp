import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Play, Plus } from 'lucide-react';

export const Route = createFileRoute('/routines/')({
  component: RoutinesPage,
});

function RoutinesPage() {
  const list = trpc.routines.list.useQuery();
  const start = trpc.sessions.start.useMutation();
  const navigate = useNavigate();

  const onStart = async (routineId: string) => {
    const session = await start.mutateAsync({ routineId });
    if (!session) return;
    navigate({ to: '/train/$sessionId', params: { sessionId: session.id } });
  };

  if (list.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (list.isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
        Error al cargar rutinas.
      </div>
    );
  }

  if (!list.data?.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <h1 className="text-xl font-semibold">Sin rutinas</h1>
        <p className="text-zinc-400">Creá tu primera rutina para empezar a entrenar.</p>
        <Button onClick={() => navigate({ to: '/routines/new' })}>
          <Plus className="mr-2 h-4 w-4" /> Crear rutina
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rutinas</h1>
        <Button size="sm" onClick={() => navigate({ to: '/routines/new' })}>
          <Plus className="mr-2 h-4 w-4" /> Nueva
        </Button>
      </div>
      <div className="grid gap-3">
        {list.data.map((routine) => (
          <Card key={routine.id} className="transition-colors hover:border-[var(--color-primary)]">
            <CardContent className="flex flex-col gap-3 py-4">
              <div className="flex items-center justify-between">
                <Link to="/routines/$id" params={{ id: routine.id }} className="flex-1">
                  <h3 className="font-semibold">{routine.name}</h3>
                  <p className="text-sm text-zinc-400">{routine.exerciseCount} ejercicios</p>
                </Link>
                <Button
                  size="icon"
                  onClick={() => onStart(routine.id)}
                  disabled={start.isPending}
                  aria-label={`Iniciar sesión con ${routine.name}`}
                >
                  {start.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
