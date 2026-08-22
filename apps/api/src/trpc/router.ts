import { router } from './trpc.js';
import { catalogRouter } from './routers/catalog.js';
import { routinesRouter } from './routers/routines.js';
import { sessionsRouter } from './routers/sessions.js';
import { progressRouter } from './routers/progress.js';

export const appRouter = router({
  catalog: catalogRouter,
  routines: routinesRouter,
  sessions: sessionsRouter,
  progress: progressRouter,
});

export type AppRouter = typeof appRouter;
