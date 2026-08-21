import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { RoutineForm } from '@/components/routine/RoutineForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export const Route = createFileRoute('/routines/$id')({
  component: EditRoutinePage,
});

function EditRoutinePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const detail = trpc.routines.byId.useQuery({ id });
  const update = trpc.routines.update.useMutation({
    onSuccess: () => navigate({ to: '/routines' }),
  });
  const remove = trpc.routines.delete.useMutation({
    onSuccess: () => navigate({ to: '/routines' }),
  });

  if (detail.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (!detail.data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-zinc-400">
          Rutina no encontrada.
          <Button className="mt-4 w-full" variant="outline" onClick={() => navigate({ to: '/routines' })}>
            Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <RoutineForm
        routine={detail.data}
        onSubmit={async (values) => {
          await update.mutateAsync({ id, ...values });
        }}
        isPending={update.isPending}
      />
      <Button
        variant="outline"
        className="w-full text-red-400"
        disabled={remove.isPending}
        onClick={() => {
          if (confirm('¿Eliminar esta rutina?')) remove.mutate({ id });
        }}
      >
        {remove.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Eliminar rutina
      </Button>
    </div>
  );
}
