import { router } from './trpc.js';
import { catalogRouter } from './routers/catalog.js';

export const appRouter = router({
  catalog: catalogRouter,
});

export type AppRouter = typeof appRouter;
