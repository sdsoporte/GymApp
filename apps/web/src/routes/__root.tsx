import { createRootRoute, Outlet } from '@tanstack/react-router';
import { BottomNav } from '@/components/layout/BottomNav';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)] pb-20 text-[var(--color-foreground)] md:pb-0">
      <main className="flex-1 px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
