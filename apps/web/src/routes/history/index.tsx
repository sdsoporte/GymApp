import { createFileRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Calendar, Clock, Dumbbell } from 'lucide-react';

const searchSchema = z.object({ page: z.number().default(1) });
const LIMIT = 20;

export const Route = createFileRoute('/history/')({
  validateSearch: zodValidator(searchSchema),
  component: HistoryPage,
});

function fmtDate(value: Date | string | null) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(value: Date | string | null) {
  if (!value) return '-';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function HistoryPage() {
  const search = useSearch({ from: '/history/' });
  const navigate = useNavigate({ from: '/history/' });
  const offset = (search.page - 1) * LIMIT;
  const query = trpc.sessions.history.useQuery({ limit: LIMIT, offset });
  const totalPages = Math.ceil((query.data?.total ?? 0) / LIMIT);

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
        Error al cargar el historial.
      </div>
    );
  }

  if (!query.data?.items.length) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <Calendar className="h-12 w-12 text-zinc-500" />
        <h1 className="text-xl font-semibold">Sin sesiones completadas</h1>
        <p className="max-w-xs text-zinc-400">Cuando termines una rutina vas a verla acá.</p>
        <Link to="/routines">
          <Button>Ir a rutinas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Historial</h1>
      <div className="grid gap-3">
        {query.data.items.map((session) => (
          <Link key={session.id} to="/history/$id" params={{ id: session.id }}>
            <Card data-testid="history-session-row" className="transition-colors hover:border-[var(--color-primary)]">
              <CardContent className="flex flex-col gap-2 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{fmtDate(session.completedAt)}</span>
                  <span className="text-sm text-zinc-400">{fmtTime(session.completedAt)}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
                  <span className="flex items-center gap-1"><Dumbbell className="h-4 w-4" />{session.routineName || 'Sin rutina'}</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{session.durationMinutes} min</span>
                  <span>{session.totalSets} series</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      {totalPages > 1 ? (
        <div className="flex items-center justify-between py-4">
          <Button variant="outline" size="sm" disabled={search.page <= 1} onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page - 1 }) })}>
            Anterior
          </Button>
          <span className="text-sm text-zinc-400">Página {search.page} de {totalPages}</span>
          <Button variant="outline" size="sm" disabled={search.page >= totalPages} onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })}>
            Siguiente
          </Button>
        </div>
      ) : null}
    </div>
  );
}
