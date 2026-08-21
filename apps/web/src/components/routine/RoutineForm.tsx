import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ExerciseCard } from '@/components/exercise/ExerciseCard';
import { SearchBar } from '@/components/exercise/SearchBar';
import { useDebounce } from '@/hooks/use-debounce';
import { ArrowUp, ArrowDown, Trash2, X, Plus, Loader2 } from 'lucide-react';

type CatalogItem = {
  id: string;
  name: string;
  nameEs: string | null;
  imageUrl: string | null;
  bodyPart: string | null;
  equipment: string | null;
  target: string | null;
};

interface FormExercise {
  clientId: string;
  exerciseId: string;
  name?: string;
  nameEs?: string | null;
  orderIndex: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  restSeconds: number;
}

interface RoutineFormProps {
  routine?: {
    name: string;
    exercises: Array<{
      exerciseId: string;
      name?: string;
      nameEs?: string | null;
      orderIndex: number;
      targetSets?: number | null;
      targetRepsMin?: number | null;
      targetRepsMax?: number | null;
      restSeconds?: number | null;
    }>;
  };
  onSubmit: (values: {
    name: string;
    active: boolean;
    exercises: Array<{
      exerciseId: string;
      orderIndex: number;
      targetSets?: number;
      targetRepsMin?: number;
      targetRepsMax?: number;
      restSeconds?: number;
    }>;
  }) => Promise<void>;
  isPending: boolean;
}

const fields = [
  { key: 'targetSets' as const, label: 'Series', min: 1 },
  { key: 'targetRepsMin' as const, label: 'Rep mín', min: 1 },
  { key: 'targetRepsMax' as const, label: 'Rep máx', min: 1 },
  { key: 'restSeconds' as const, label: 'Descanso', min: 0 },
];

export function RoutineForm({ routine, onSubmit, isPending }: RoutineFormProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(routine?.name ?? '');
  const [exercises, setExercises] = useState<FormExercise[]>(
    (routine?.exercises ?? []).map((e) => ({
      clientId: e.exerciseId,
      exerciseId: e.exerciseId,
      name: e.name,
      nameEs: e.nameEs,
      orderIndex: e.orderIndex,
      targetSets: e.targetSets ?? 3,
      targetRepsMin: e.targetRepsMin ?? 8,
      targetRepsMax: e.targetRepsMax ?? 12,
      restSeconds: e.restSeconds ?? 60,
    }))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQ, setPickerQ] = useState('');
  const debouncedQ = useDebounce(pickerQ, 250);
  const catalog = trpc.catalog.list.useQuery({ q: debouncedQ, limit: 20, offset: 0 });

  const update = (clientId: string, patch: Partial<FormExercise>) =>
    setExercises((prev) => prev.map((e) => (e.clientId === clientId ? { ...e, ...patch } : e)));

  const move = (index: number, dir: number) =>
    setExercises((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((e, i) => ({ ...e, orderIndex: i }));
    });

  const remove = (clientId: string) =>
    setExercises((prev) => prev.filter((e) => e.clientId !== clientId).map((e, i) => ({ ...e, orderIndex: i })));

  const add = (item: CatalogItem) => {
    setExercises((prev) => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        exerciseId: item.id,
        name: item.name,
        nameEs: item.nameEs,
        orderIndex: prev.length,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 12,
        restSeconds: 60,
      },
    ]);
    setPickerOpen(false);
    setPickerQ('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      name,
      active: true,
      exercises: exercises.map((e) => ({
        exerciseId: e.exerciseId,
        orderIndex: e.orderIndex,
        targetSets: e.targetSets,
        targetRepsMin: e.targetRepsMin,
        targetRepsMax: e.targetRepsMax,
        restSeconds: e.restSeconds,
      })),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="icon" onClick={() => navigate({ to: '/routines' })}>
          <X className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{routine ? 'Editar rutina' : 'Nueva rutina'}</h1>
      </div>

      <Input placeholder="Nombre de la rutina" value={name} onChange={(e) => setName(e.target.value)} required />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Ejercicios ({exercises.length})</h2>
          <Button type="button" size="sm" onClick={() => setPickerOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Agregar
          </Button>
        </div>
        {exercises.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-zinc-400">Agregá al menos un ejercicio para guardar la rutina.</CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <Card key={exercise.clientId}>
                <CardContent className="space-y-3 p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{exercise.nameEs || exercise.name}</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button type="button" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp className="h-4 w-4" /></button>
                      <button type="button" onClick={() => move(index, 1)} disabled={index === exercises.length - 1}><ArrowDown className="h-4 w-4" /></button>
                      <button type="button" onClick={() => remove(exercise.clientId)}><Trash2 className="h-4 w-4 text-red-400" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {fields.map((f) => (
                      <Input
                        key={f.key}
                        type="number"
                        label={f.label}
                        value={exercise[f.key]}
                        min={f.min}
                        onChange={(e) => update(exercise.clientId, { [f.key]: Number(e.target.value) } as Partial<FormExercise>)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !name.trim() || exercises.length === 0}>
        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Guardar rutina
      </Button>

      {pickerOpen ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60 p-4 md:items-center md:justify-center">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--color-card)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Agregar ejercicio</h2>
              <Button type="button" variant="ghost" size="icon" onClick={() => setPickerOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <SearchBar value={pickerQ} onChange={setPickerQ} />
            {catalog.isLoading ? (
              <div className="py-8 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></div>
            ) : (
              <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto">
                {catalog.data?.items.length ? (
                  catalog.data.items.map((item) => (
                    <button key={item.id} type="button" className="w-full text-left" onClick={() => add(item)}>
                      <ExerciseCard exercise={item} />
                    </button>
                  ))
                ) : (
                  <p className="py-4 text-center text-zinc-400">Sin resultados.</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </form>
  );
}
