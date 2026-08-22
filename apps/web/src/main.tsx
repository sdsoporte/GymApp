import React from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen';
import { TRPCProvider } from './lib/trpc';
import { registerPWA } from './lib/pwa';
import './index.css';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

registerPWA();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <TRPCProvider>
        <RouterProvider router={router} />
      </TRPCProvider>
    </React.StrictMode>
  );
}
