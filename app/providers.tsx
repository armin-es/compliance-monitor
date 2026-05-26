"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const isDev = process.env.NODE_ENV === "development";

const devPersister = isDev
  ? createSyncStoragePersister({ storage: typeof window !== "undefined" ? window.localStorage : undefined })
  : null;

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: isDev ? Infinity : 60 * 1000,
        gcTime: isDev ? 1000 * 60 * 60 * 24 : undefined,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  if (isDev && devPersister) {
    return (
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister: devPersister }}>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
