import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BodyMetricValues {
  measuredAt: Date;
  weightKg?: number;
  bodyFatPercent?: number;
  waistCm?: number;
  notes?: string;
}

interface BodyMetricFormProps {
  initial?: {
    measuredAt?: Date | string | null;
    weightKg?: string | number | null;
    bodyFatPercent?: string | number | null;
    waistCm?: string | number | null;
    notes?: string | null;
  };
  onSubmit: (values: BodyMetricValues) => void;
  onCancel?: () => void;
  isPending?: boolean;
}

export function BodyMetricForm({ initial = {}, onSubmit, onCancel, isPending }: BodyMetricFormProps) {
  const [measuredAt, setMeasuredAt] = useState(() => {
    const value = initial.measuredAt ? new Date(initial.measuredAt) : new Date();
    return value.toISOString().slice(0, 16);
  });
  const [weightKg, setWeightKg] = useState(initial.weightKg?.toString() ?? '');
  const [bodyFatPercent, setBodyFatPercent] = useState(initial.bodyFatPercent?.toString() ?? '');
  const [waistCm, setWaistCm] = useState(initial.waistCm?.toString() ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const values: BodyMetricValues = { measuredAt: new Date(measuredAt), notes: notes.trim() || undefined };
    const weight = parseFloat(weightKg);
    if (!isNaN(weight) && weight > 0) values.weightKg = weight;
    const fat = parseFloat(bodyFatPercent);
    if (!isNaN(fat) && fat >= 0) values.bodyFatPercent = fat;
    const waist = parseFloat(waistCm);
    if (!isNaN(waist) && waist >= 0) values.waistCm = waist;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="measuredAt" className="mb-1 block text-sm text-zinc-400">Fecha y hora</label>
        <Input id="measuredAt" type="datetime-local" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} required />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor="weightKg" className="mb-1 block text-sm text-zinc-400">Peso (kg)</label>
          <Input id="weightKg" type="number" step="0.1" min="0" max="500" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="70" />
        </div>
        <div>
          <label htmlFor="bodyFatPercent" className="mb-1 block text-sm text-zinc-400">% Grasa</label>
          <Input id="bodyFatPercent" type="number" step="0.1" min="0" max="100" value={bodyFatPercent} onChange={(e) => setBodyFatPercent(e.target.value)} placeholder="15" />
        </div>
        <div>
          <label htmlFor="waistCm" className="mb-1 block text-sm text-zinc-400">Cintura (cm)</label>
          <Input id="waistCm" type="number" step="0.1" min="0" max="300" value={waistCm} onChange={(e) => setWaistCm(e.target.value)} placeholder="80" />
        </div>
      </div>
      <div>
        <label htmlFor="notes" className="mb-1 block text-sm text-zinc-400">Notas</label>
        <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={isPending}>Guardar</Button>
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button> : null}
      </div>
    </form>
  );
}
