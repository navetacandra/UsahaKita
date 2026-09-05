import { Hono } from 'hono';
import { renderer } from './renderer';
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

type Bindings = {
  AUTH_DO: DurableObjectNamespace;
  TENANT_DO: DurableObjectNamespace;
  AI_API_KEY?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use('*', errorHandler);

app.use(renderer);

app.get('/', (c) => {
  return c.render(<h1>UsahaKita API</h1>);
});

const api = new Hono<{ Bindings: Bindings }>();

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

export default app;

export { AuthDirectoryDO } from './durable-objects/auth-directory';
export { TenantDO } from './durable-objects/tenant';
