import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { RestTimer } from './RestTimer';
import { Check, Loader2, Trash2 } from 'lucide-react';

interface LoggedSet {
  id: string;
  setNumber: number;
  reps: number | null;
  weightKg: string | null;
  rpe: string | null;
  restSeconds: number | null;
}

interface ExerciseTarget {
  exerciseId: string;
  name: string | null;
  nameEs: string | null;
  gifUrl: string | null;
  orderIndex: number;
  targetSets: number | null;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  restSeconds: number | null;
}

interface SetLoggerProps {
  sessionId: string;
  exercise: ExerciseTarget;
  sets: LoggedSet[];
  onLog: (input: {
    exerciseId: string;
    setNumber: number;
    reps: number;
    weightKg: number;
    rpe?: number;
    restSeconds?: number;
  }) => void;
  onDelete: (setId: string) => void;
  isPending: boolean;
}

export function SetLogger({ sessionId, exercise, sets, onLog, onDelete, isPending }: SetLoggerProps) {
  const nextNumber = sets.length + 1;
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [savedSetNumber, setSavedSetNumber] = useState<number | null>(null);

  const targetText = [
    exercise.targetSets ? `${exercise.targetSets} series` : null,
    exercise.targetRepsMin && exercise.targetRepsMax
      ? `${exercise.targetRepsMin}-${exercise.targetRepsMax} reps`
      : exercise.targetRepsMin
        ? `${exercise.targetRepsMin} reps`
        : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = Number(weight);
    const repsNum = Number(reps);
    const rpeNum = rpe ? Number(rpe) : undefined;
    if (!weight || isNaN(weightNum) || !reps || isNaN(repsNum) || weightNum < 0 || repsNum < 0) return;

    onLog({
      exerciseId: exercise.exerciseId,
      setNumber: nextNumber,
      reps: repsNum,
      weightKg: weightNum,
      rpe: rpeNum,
      restSeconds: exercise.restSeconds ?? undefined,
    });
    setSavedSetNumber(nextNumber);
    setWeight('');
    setReps('');
    setRpe('');
  };

  const restSeconds = savedSetNumber === nextNumber ? exercise.restSeconds ?? 60 : 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-3">
        <div className="flex items-center gap-3">
          {exercise.gifUrl ? (
            <img
              src={exercise.gifUrl}
              alt={exercise.nameEs || exercise.name || ''}
              className="h-14 w-14 rounded-lg object-cover"
              loading="lazy"
            />
          ) : null}
          <div className="flex-1">
            <p className="font-medium">{exercise.nameEs || exercise.name}</p>
            {targetText ? <p className="text-xs text-zinc-400">{targetText}</p> : null}
          </div>
        </div>

        {sets.length > 0 ? (
          <div className="space-y-2">
            {sets
              .sort((a, b) => a.setNumber - b.setNumber)
              .map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-muted)] px-3 py-2"
                >
                  <div className="text-sm">
                    <span className="font-medium">Serie {set.setNumber}:</span>{' '}
                    <span>
                      {set.weightKg}kg × {set.reps}
                      {set.rpe ? ` @RPE ${set.rpe}` : ''}
                    </span>
                  </div>
                  <Button type="button" size="icon" variant="ghost" onClick={() => onDelete(set.id)} aria-label={`Eliminar serie ${set.setNumber}`}>
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </Button>
                </div>
              ))}
          </div>
        ) : null}

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Input type="number" label="Peso (kg)" value={weight} min={0} step={0.25} onChange={(e) => setWeight(e.target.value)} required />
            <Input type="number" label="Reps" value={reps} min={0} onChange={(e) => setReps(e.target.value)} required />
            <Input type="number" label="RPE" value={rpe} min={0} max={10} step={0.5} onChange={(e) => setRpe(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Registrar serie {nextNumber}
          </Button>
        </form>

        {restSeconds > 0 ? (
          <RestTimer seconds={restSeconds} autoStart={savedSetNumber === nextNumber} />
        ) : null}
      </CardContent>
    </Card>
  );
}
