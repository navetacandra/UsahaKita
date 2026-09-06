import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import openApiDoc from '../../../../docs/openapi-content.json';

const docs = new Hono();

docs.get('/openapi.json', (c) => {
  return c.json(openApiDoc);
});

docs.get('/openapi.yaml', (c) => {
  return c.json(openApiDoc);
});

docs.get('/swagger', swaggerUI({ url: '/docs/openapi.json' }));

docs.get('/', (c) => {
  return c.redirect('/docs/swagger');
});

export default docs;
