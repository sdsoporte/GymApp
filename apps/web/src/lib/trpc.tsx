import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { useState, type ReactNode } from 'react';
import superjson from 'superjson';
import type { AppRouter } from '@gymapp/api/trpc';

export const trpc = createTRPCReact<AppRouter>();

function getUrl() {
  if (typeof window === 'undefined') return 'http://localhost:3000/trpc';
  return '/trpc';
}

const PERSISTED_QUERY_KEYS = new Set(['catalog', 'routines', 'sessions', 'progress']);

function shouldPersistQuery(queryKey: readonly unknown[]) {
  const first = queryKey[0];
  return typeof first === 'string' && PERSISTED_QUERY_KEYS.has(first);
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        networkMode: 'offlineFirst',
        gcTime: 7 * 24 * 60 * 60 * 1000,
      },
    },
  });
}

function makeTrpcClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: getUrl(),
        transformer: superjson,
      }),
    ],
  });
}

const persistOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  buster: '1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query: { queryKey: readonly unknown[] }) => shouldPersistQuery(query.queryKey),
  },
};

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient);
  const [trpcClient] = useState(makeTrpcClient);

  const provider = (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      {children}
    </trpc.Provider>
  );

  if (typeof window === 'undefined') {
    return <QueryClientProvider client={queryClient}>{provider}</QueryClientProvider>;
  }

  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'gymapp-query-cache',
    throttleTime: 1000,
  });

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ ...persistOptions, persister }}>
      {provider}
    </PersistQueryClientProvider>
  );
}
