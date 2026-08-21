import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { RoutineForm } from '@/components/routine/RoutineForm';

export const Route = createFileRoute('/routines/new')({ component: NewRoutinePage });

function NewRoutinePage() {
  const navigate = useNavigate();
  const create = trpc.routines.create.useMutation({ onSuccess: () => navigate({ to: '/routines' }) });
  return <RoutineForm onSubmit={async (values) => { await create.mutateAsync(values); }} isPending={create.isPending} />;
}
