import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Sheet } from '@/components/ui/sheet';
import { useState } from 'react';

interface Filters {
  bodyPart: string;
  muscleGroup: string;
  equipment: string;
  target: string;
}

interface FilterSheetProps {
  filters: Filters;
  facets: {
    bodyParts: string[];
    muscleGroups: string[];
    equipment: string[];
    targets: string[];
  };
  onChange: (filters: Filters) => void;
}

export function FilterSheet({ filters, facets, onChange }: FilterSheetProps) {
  const [open, setOpen] = useState(false);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const makeSelect = (key: keyof Filters, label: string, options: string[]) => (
    <Select
      key={key}
      label={label}
      value={filters[key]}
      onChange={(e) => onChange({ ...filters, [key]: e.target.value })}
    >
      <option value="">Todos</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </Select>
  );

  return (
    <>
      <Button
        variant={activeCount ? 'primary' : 'outline'}
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtros {activeCount ? `(${activeCount})` : ''}
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Filtros">
        <div className="space-y-4">
          {makeSelect('bodyPart', 'Zona corporal', facets.bodyParts)}
          {makeSelect('muscleGroup', 'Grupo muscular', facets.muscleGroups)}
          {makeSelect('equipment', 'Equipamiento', facets.equipment)}
          {makeSelect('target', 'Objetivo', facets.targets)}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => onChange({ bodyPart: '', muscleGroup: '', equipment: '', target: '' })}
          >
            Limpiar filtros
          </Button>
        </div>
      </Sheet>
    </>
  );
}
