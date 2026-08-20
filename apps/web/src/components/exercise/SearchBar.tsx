import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex items-center gap-2">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Buscar ejercicio..."
        className="pl-9"
      />
      {value ? (
        <Button variant="ghost" size="icon" onClick={() => onChange('')} aria-label="Limpiar">
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
}
