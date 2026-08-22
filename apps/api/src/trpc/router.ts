import { router } from './trpc.js';
import { catalogRouter } from './routers/catalog.js';
import { routinesRouter } from './routers/routines.js';
import { sessionsRouter } from './routers/sessions.js';

export const appRouter = router({
  catalog: catalogRouter,
  routines: routinesRouter,
  sessions: sessionsRouter,
});

export type AppRouter = typeof appRouter;
