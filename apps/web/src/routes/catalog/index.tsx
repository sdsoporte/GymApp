import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useDebounce } from '@/hooks/use-debounce';
import { SearchBar } from '@/components/exercise/SearchBar';
import { FilterSheet } from '@/components/exercise/FilterSheet';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { Button } from '@/components/ui/button';
import { Loader2, SearchX } from 'lucide-react';

const searchSchema = z.object({
  q: z.string().default(''),
  bodyPart: z.string().default(''),
  muscleGroup: z.string().default(''),
  equipment: z.string().default(''),
  target: z.string().default(''),
  page: z.number().default(1),
});

const LIMIT = 20;

export const Route = createFileRoute('/catalog/')({
  validateSearch: zodValidator(searchSchema),
  component: CatalogPage,
});

function CatalogPage() {
  const search = useSearch({ from: '/catalog/' });
  const navigate = useNavigate({ from: '/catalog/' });

  const [q, setQ] = useState(search.q);
  const debouncedQ = useDebounce(q, 250);

  const filters = {
    bodyPart: search.bodyPart,
    muscleGroup: search.muscleGroup,
    equipment: search.equipment,
    target: search.target,
  };

  const offset = (search.page - 1) * LIMIT;

  const facetsQuery = trpc.catalog.facets.useQuery();
  const listQuery = trpc.catalog.list.useQuery({
    q: debouncedQ,
    ...filters,
    limit: LIMIT,
    offset,
  });

  const setSearch = (patch: Partial<z.infer<typeof searchSchema>>) => {
    navigate({ search: (prev) => ({ ...prev, ...patch, page: 1 }) });
  };

  const totalPages = Math.ceil((listQuery.data?.total ?? 0) / LIMIT);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Catálogo</h1>
      <div className="flex gap-2">
        <div className="flex-1">
          <SearchBar value={q} onChange={(v) => setQ(v)} />
        </div>
        <FilterSheet
          filters={filters}
          facets={facetsQuery.data ?? { bodyParts: [], muscleGroups: [], equipment: [], targets: [] }}
          onChange={(next) => setSearch(next)}
        />
      </div>

      {listQuery.isLoading || facetsQuery.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : listQuery.isError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-200">
          Error al cargar el catálogo. Intenta de nuevo.
        </div>
      ) : (
        <>
          <p className="text-sm text-zinc-400">
            {listQuery.data?.total ?? 0} resultados
          </p>
          {listQuery.data?.items.length ? (
            <div className="grid gap-3">
              {listQuery.data.items.map((exercise) => (
                <ExerciseCard key={exercise.id} exercise={exercise} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-border)] p-8 text-center">
              <SearchX className="h-10 w-10 text-zinc-500" />
              <p className="text-zinc-400">No se encontraron ejercicios.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQ('');
                  setSearch({ q: '', bodyPart: '', muscleGroup: '', equipment: '', target: '' });
                }}
              >
                Limpiar filtros
              </Button>
            </div>
          )}
          {totalPages > 1 ? (
            <div className="flex items-center justify-between py-4">
              <Button
                variant="outline"
                size="sm"
                disabled={search.page <= 1}
                onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page - 1 }) })}
              >
                Anterior
              </Button>
              <span className="text-sm text-zinc-400">
                Página {search.page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={search.page >= totalPages}
                onClick={() => navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })}
              >
                Siguiente
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
