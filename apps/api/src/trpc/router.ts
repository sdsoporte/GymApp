import { router } from './trpc.js';
import { catalogRouter } from './routers/catalog.js';
import { routinesRouter } from './routers/routines.js';

export const appRouter = router({
  catalog: catalogRouter,
  routines: routinesRouter,
});

export type AppRouter = typeof appRouter;
