import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { RoutineForm } from '@/components/routine/RoutineForm';

export const Route = createFileRoute('/routines/new')({ component: NewRoutinePage });

function NewRoutinePage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const create = trpc.routines.create.useMutation({
    onSuccess: async () => {
      await utils.routines.invalidate();
      navigate({ to: '/routines' });
    },
  });
  return <RoutineForm onSubmit={async (values) => { await create.mutateAsync(values); }} isPending={create.isPending} />;
}
