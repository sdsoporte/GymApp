import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/lib/pwa';

export function OfflineBanner() {
  const online = useNetworkStatus();
  if (online) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-yellow-500/10 px-4 py-2 text-center text-sm font-medium text-yellow-200 backdrop-blur-sm">
      <WifiOff className="h-4 w-4" />
      Sin conexión. Los datos se muestran desde caché; los cambios no se guardarán hasta reconectar.
    </div>
  );
}
