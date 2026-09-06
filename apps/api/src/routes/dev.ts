import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse } from '../lib/response';

const dev = new Hono<{ Bindings: Env }>();

dev.get('/chat', async (c) => {
  const aiBaseUrl = (c.env.AI_BASE_URL || 'https://opencode.ai').replace(/\/+$/, '');
  const aiModel = c.env.AI_MODEL || 'mimo-v2.5-free';
  const aiApiKey = c.env.AI_API_KEY || 'Bearer public';

  const sessionId = `ses_${crypto.randomUUID().replace(/-/g, '')}`;
  const requestId = `msg_${crypto.randomUUID().replace(/-/g, '')}`;

  const started = Date.now();

  try {
    const response = await fetch(`${aiBaseUrl}/zen/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': aiApiKey,
        'x-opencode-client': 'desktop',
        'x-opencode-session': sessionId,
        'x-opencode-request': requestId,
        'x-opencode-project': 'global',
        'Accept': '*/*',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
        max_tokens: 16,
      }),
    });

    const latency = Date.now() - started;
    const body = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const err = body?.error as { message?: string; type?: string } | undefined;
      return c.json(successResponse({
        status: 'error',
        provider: aiBaseUrl.includes('opencode') ? 'opencode' : 'custom',
        model: aiModel,
        http_status: response.status,
        error_type: err?.type || 'unknown',
        error_message: err?.message || 'Unknown error',
        latency_ms: latency,
        session_id: sessionId,
        request_id: requestId,
      }));
    }

    const choices = (body as { choices?: { message: { content: string | null; reasoning_content?: string | null } }[] }).choices;
    const msg = choices?.[0]?.message;
    const reply = msg?.content || msg?.reasoning_content || '';

    return c.json(successResponse({
      status: 'ok',
      provider: aiBaseUrl.includes('opencode') ? 'opencode' : 'custom',
      model: aiModel,
      reply: reply.slice(0, 200),
      latency_ms: latency,
      session_id: sessionId,
      request_id: requestId,
    }));
  } catch (e: unknown) {
    const latency = Date.now() - started;
    return c.json(successResponse({
      status: 'error',
      provider: aiBaseUrl.includes('opencode') ? 'opencode' : 'custom',
      model: aiModel,
      error_message: e instanceof Error ? e.message : 'Network error',
      latency_ms: latency,
      session_id: sessionId,
      request_id: requestId,
    }));
  }
});

export default dev;
