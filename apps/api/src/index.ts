import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { db, sql } from '@gymapp/db';

const app = new Hono();

app.get('/health', (c) => c.json({ status: 'ok' }));

app.get('/health/db', async (c) => {
  try {
    await db.execute(sql`SELECT 1`);
    return c.json({ status: 'ok', database: 'connected' });
  } catch {
    return c.json({ status: 'error', database: 'unreachable' }, 503);
  }
});

let requestCount = 0;

app.get('/metrics', (c) => {
  if (process.env.METRICS_ENABLED !== 'true') {
    return c.notFound();
  }
  requestCount += 1;
  const body = `gymapp_http_requests_total ${requestCount}\n`;
  return c.text(body, 200, { 'Content-Type': 'text/plain; version=0.0.4' });
});

const port = Number(process.env.PORT || '3000');

serve({
  fetch: app.fetch,
  port,
});
