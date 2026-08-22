import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { SimpleLineChart, type LineChartPoint } from '@/components/charts/SimpleLineChart';
import { BodyMetricForm } from '@/components/progress/BodyMetricForm';
import { Loader2, TrendingUp, Scale, Activity, ChevronLeft, ChevronRight, Trash2, Plus, X } from 'lucide-react';

const LIMIT = 10;

export const Route = createFileRoute('/progress/')({
  component: ProgressPage,
});

function formatDateShort(value: Date | string | null) {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function toChartPoints(rows: Array<{ date: Date | string | null; value: number | string | null }>): LineChartPoint[] {
  return rows
    .filter((r) => r.value != null)
    .map((r) => ({
      label: formatDateShort(r.date),
      value: typeof r.value === 'string' ? parseFloat(r.value) : r.value,
    }))
    .reverse();
}

function ProgressPage() {
  const [exerciseId, setExerciseId] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const offset = (page - 1) * LIMIT;

  const exercisesList = trpc.catalog.list.useQuery({ limit: 200, offset: 0 });
  const weightQuery = trpc.progress.exerciseWeight.useQuery({ exerciseId }, { enabled: Boolean(exerciseId) });
  const metricsQuery = trpc.progress.bodyMetrics.list.useQuery({ limit: LIMIT, offset });
  const createMetric = trpc.progress.bodyMetrics.create.useMutation({ onSuccess: () => { setShowForm(false); metricsQuery.refetch(); } });
  const updateMetric = trpc.progress.bodyMetrics.update.useMutation({ onSuccess: () => { setEditing(null); metricsQuery.refetch(); } });
  const deleteMetric = trpc.progress.bodyMetrics.delete.useMutation({ onSuccess: () => metricsQuery.refetch() });

  const totalPages = Math.ceil((metricsQuery.data?.total ?? 0) / LIMIT);
  const weightData: LineChartPoint[] = (weightQuery.data?.data ?? [])
    .filter((r) => r.bestWeightKg != null)
    .map((r) => ({ label: formatDateShort(r.date), value: parseFloat(String(r.bestWeightKg)) }))
    .reverse();

  const weightSummary = weightData.length
    ? `Máximo: ${Math.max(...weightData.map((d) => d.value ?? 0)).toFixed(1)}kg en ${weightData.length} sesiones.`
    : 'Seleccioná un ejercicio para ver su evolución de peso.';

  const metricRows = metricsQuery.data?.items ?? [];
  const weightMetricData = toChartPoints(metricRows.map((m) => ({ date: m.measuredAt, value: m.weightKg })));
  const fatMetricData = toChartPoints(metricRows.map((m) => ({ date: m.measuredAt, value: m.bodyFatPercent })));
  const waistMetricData = toChartPoints(metricRows.map((m) => ({ date: m.measuredAt, value: m.waistCm })));
  const editingMetric = editing ? metricRows.find((m) => m.id === editing) : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Progreso</h1>

      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="font-semibold">Evolución por ejercicio</h2>
          </div>
          {exercisesList.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          ) : (
            <Select value={exerciseId} onChange={(e) => setExerciseId(e.target.value)} data-testid="exercise-progress-select">
              <option value="">Seleccionar ejercicio</option>
              {(exercisesList.data?.items ?? []).map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.nameEs || ex.name}</option>
              ))}
            </Select>
          )}
          {exerciseId && weightQuery.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          ) : exerciseId && weightData.length ? (
            <>
              <SimpleLineChart data={weightData} label="Mejor peso por sesión" unit="kg" data-testid="progress-weight-chart" />
              <ul className="space-y-1 text-sm text-zinc-400">
                {weightData.slice(-5).map((p, i) => <li key={i}>{p.label}: {p.value?.toFixed(1)}kg</li>)}
              </ul>
            </>
          ) : exerciseId ? (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-zinc-400">
              No hay registros de peso para este ejercicio.
            </div>
          ) : (
            <p className="text-sm text-zinc-400">{weightSummary}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-[var(--color-primary)]" />
              <h2 className="font-semibold">Métricas corporales</h2>
            </div>
            <Button size="sm" onClick={() => setShowForm((s) => !s)}>
              {showForm ? <X className="mr-1 h-4 w-4" /> : <Plus className="mr-1 h-4 w-4" />}
              {showForm ? 'Cerrar' : 'Nueva'}
            </Button>
          </div>

          {showForm ? <BodyMetricForm onSubmit={(v) => createMetric.mutate(v)} isPending={createMetric.isPending} onCancel={() => setShowForm(false)} /> : null}

          {editingMetric ? (
            <div className="rounded-lg border border-[var(--color-border)] p-4">
              <BodyMetricForm initial={editingMetric} onSubmit={(v) => updateMetric.mutate({ id: editingMetric.id, ...v })} isPending={updateMetric.isPending} onCancel={() => setEditing(null)} />
            </div>
          ) : null}

          {metricsQuery.isLoading ? (
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          ) : metricRows.length ? (
            <>
              <div className="space-y-4">
                {weightMetricData.length ? <SimpleLineChart data={weightMetricData} label="Peso corporal" unit="kg" color="#82ca9d" /> : null}
                <div className="grid gap-4 md:grid-cols-2">
                  {fatMetricData.length ? <SimpleLineChart data={fatMetricData} label="% grasa corporal" unit="%" color="#ffc658" /> : null}
                  {waistMetricData.length ? <SimpleLineChart data={waistMetricData} label="Cintura" unit="cm" color="#8884d8" /> : null}
                </div>
              </div>

              <div className="space-y-2">
                {metricRows.map((m) => (
                  <div key={m.id} data-testid="body-metric-row" className="flex items-center justify-between rounded-lg border border-[var(--color-border)] p-3 text-sm">
                    <div>
                      <p className="font-medium">{formatDateShort(m.measuredAt)}</p>
                      <p className="text-zinc-400">
                        Peso: {m.weightKg ? `${m.weightKg}kg` : '-'} · Grasa: {m.bodyFatPercent ? `${m.bodyFatPercent}%` : '-'} · Cintura: {m.waistCm ? `${m.waistCm}cm` : '-'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditing(m.id)}>Editar</Button>
                      <Button size="icon" variant="ghost" className="text-red-400" onClick={() => { if (confirm('¿Eliminar esta métrica?')) deleteMetric.mutate({ id: m.id }); }} disabled={deleteMetric.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 ? (
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                  </Button>
                  <span className="text-sm text-zinc-400">Página {page} de {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-6 text-center text-zinc-400">
              <Activity className="mx-auto mb-2 h-10 w-10 text-zinc-500" />
              <p>Todavía no hay métricas corporales.</p>
              <p className="text-sm">Agregá tu primer registro para ver la evolución.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
