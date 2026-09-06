import { Hono } from 'hono';
import { Env } from './types';
import { errorHandler } from './middleware/tenant';
import auth from './routes/auth';
import business from './routes/business';
import materials from './routes/materials';
import products from './routes/products';
import boms from './routes/boms';
import productions from './routes/productions';
import sales from './routes/sales';
import stockOpname from './routes/stock-opname';
import dashboard from './routes/dashboard';
import insights from './routes/insights';
import docs from './routes/docs';

const SPA_HTML = `<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UsahaKita</title>
    <meta name="description" content="Aplikasi Micro ERP multi-tenant untuk UMKM grassroots." />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/assets/index-CV4UJnd9.js"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-DjDqdzQD.css">
  </head>
  <body class="bg-[#f8fafc] text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] antialiased selection:bg-blue-600 selection:text-white">
    <div id="root"></div>
  </body>
</html>`;

const app = new Hono<{ Bindings: Env }>();

app.use('*', errorHandler);

const api = new Hono<{ Bindings: Env }>();

api.route('/auth', auth);
api.route('/business', business);
api.route('/materials', materials);
api.route('/products', products);
api.route('/boms', boms);
api.route('/productions', productions);
api.route('/sales', sales);
api.route('/stock-opnames', stockOpname);
api.route('/dashboard', dashboard);
api.route('/insights', insights);

app.route('/api/v1', api);
app.route('/docs', docs);

app.get('*', async (c) => {
  // Serve static assets from ASSETS binding, fall back to SPA HTML
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/assets/') || url.pathname === '/favicon.ico') {
    return c.env.ASSETS.fetch(c.req.url);
  }
  // For SPA routes, fetch the actual index.html from assets (has correct hashed paths)
  const indexRes = await c.env.ASSETS.fetch(new URL('/index.html', c.req.url).toString());
  if (indexRes.status === 200) return indexRes;
  return c.html(SPA_HTML);
});

export default app;

export { AuthDirectoryDO } from './durable-objects/auth-directory';
export { TenantDO } from './durable-objects/tenant';
