import { Dumbbell, Home, List, User } from 'lucide-react';
import { Link, useLocation } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

const items = [
  { to: '/', icon: Home, label: 'Inicio' },
  { to: '/catalog', icon: Dumbbell, label: 'Catálogo' },
  { to: '/routines', icon: List, label: 'Rutinas' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-card)]/90 backdrop-blur-md md:hidden">
      <div className="flex h-16 items-center justify-around">
        {items.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 p-2 text-xs',
                active ? 'text-[var(--color-primary)]' : 'text-zinc-400'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
