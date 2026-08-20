import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Dumbbell } from 'lucide-react';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 text-center">
      <div className="rounded-2xl bg-[var(--color-muted)] p-6">
        <Dumbbell className="h-12 w-12 text-[var(--color-primary)]" />
      </div>
      <h1 className="text-3xl font-bold">GymApp</h1>
      <p className="max-w-sm text-zinc-400">
        Explora el catálogo de ejercicios, arma rutinas y registra tu progreso.
      </p>
      <Link to="/catalog">
        <Button>Ver catálogo</Button>
      </Link>
    </div>
  );
}
