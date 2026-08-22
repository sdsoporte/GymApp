import { Button } from '@/components/ui/button';
import { useRestTimer } from '@/lib/timer';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

interface RestTimerProps {
  seconds: number;
  autoStart?: boolean;
  onExpire?: () => void;
}

export function RestTimer({ seconds, autoStart, onExpire }: RestTimerProps) {
  const timer = useRestTimer(onExpire);

  useEffect(() => {
    if (autoStart && !timer.isRunning && timer.remainingSeconds === 0) {
      timer.start(seconds);
    }
  }, [autoStart, seconds, timer]);

  const display = `${Math.floor(timer.remainingSeconds / 60)
    .toString()
    .padStart(2, '0')}:${(timer.remainingSeconds % 60).toString().padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
      <div className="flex-1">
        <p className="text-xs text-zinc-400">Descanso</p>
        <p className="text-2xl font-mono font-semibold" aria-live="polite" aria-atomic="true">
          {timer.remainingSeconds > 0 ? display : '00:00'}
        </p>
      </div>
      <div className="flex gap-2">
        {timer.isRunning ? (
          <Button type="button" size="icon" variant="outline" onClick={timer.pause} aria-label="Pausar descanso">
            <Pause className="h-4 w-4" />
          </Button>
        ) : timer.remainingSeconds > 0 ? (
          <Button type="button" size="icon" variant="outline" onClick={timer.resume} aria-label="Reanudar descanso">
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="icon" variant="outline" onClick={() => timer.start(seconds)} aria-label="Iniciar descanso">
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button type="button" size="icon" variant="ghost" onClick={timer.reset} aria-label="Reiniciar descanso">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
