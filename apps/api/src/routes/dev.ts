import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware, getSession } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';
import { aiChat } from '../lib/ai';

const dev = new Hono<{ Bindings: Env }>();

dev.get('/chat', async (c) => {
  const result = await aiChat(c.env, {
    messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
    max_tokens: 16,
  });

  return c.json(successResponse(result));
});

dev.get('/chat/keys', async (c) => {
  const raw = c.env.AI_API_KEYS || c.env.AI_API_KEY || '';
  const keys = raw.split(',').map((k) => k.trim()).filter(Boolean);
  const masked = keys.map((k, i) => ({
    index: i,
    prefix: k.slice(0, 8),
    suffix: k.slice(-4),
    length: k.length,
  }));

  return c.json(successResponse({
    count: keys.length,
    keys: masked,
    base_url: c.env.AI_BASE_URL || 'https://api.z.ai',
    model: c.env.AI_MODEL || 'glm-4.7-flash',
  }));
});

dev.post('/reset-data', authMiddleware, async (c) => {
  const session = getSession(c);
  // Only demo account (usr_01) can reset
  if (session.userId !== 'usr_01') {
    return c.json(errorResponse('FORBIDDEN', 'Hanya akun demo yang dapat mereset data.'), 403);
  }

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.seed(true);
  return c.json(successResponse(result));
});

export default dev;
