import { Hono } from 'hono';
import { swaggerUI } from '@hono/swagger-ui';
import YAML from 'yaml';
import openApiYaml from '../../openapi.yaml?raw';

const docs = new Hono();
const parsedDoc = YAML.parse(openApiYaml);

docs.get('/openapi.json', (c) => {
  return c.json(parsedDoc);
});

docs.get('/openapi.yaml', (c) => {
  return new Response(openApiYaml, {
    headers: {
      'Content-Type': 'text/yaml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
});

docs.get('/swagger', swaggerUI({ url: '/docs/openapi.json' }));

docs.get('/', (c) => {
  return c.redirect('/docs/swagger');
});

export default docs;
