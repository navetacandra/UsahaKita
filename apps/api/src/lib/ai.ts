import type { Env } from '../types';

export interface AiChatResult {
  status: 'ok' | 'error';
  provider: string;
  model: string;
  reply?: string;
  latency_ms: number;
  session_id: string;
  request_id: string;
  error_type?: string;
  error_message?: string;
  http_status?: number;
  api_key_index?: number;
}

export interface AiChatOptions {
  messages: { role: string; content: string }[];
  max_tokens?: number;
  temperature?: number;
}

function getApiKeys(env: Env): string[] {
  const raw = env.AI_API_KEYS || env.AI_API_KEY || '';
  return raw.split(',').map((k) => k.trim()).filter(Boolean);
}

export async function aiChat(env: Env, options: AiChatOptions): Promise<AiChatResult> {
  const baseUrl = (env.AI_BASE_URL || 'https://api.z.ai').replace(/\/+$/, '');
  const model = env.AI_MODEL || 'glm-4.7-flash';
  const keys = getApiKeys(env);
  const endpoint = `${baseUrl}/api/paas/v4/chat/completions`;

  const sessionId = `ses_${crypto.randomUUID().replace(/-/g, '')}`;
  const requestId = `msg_${crypto.randomUUID().replace(/-/g, '')}`;

  const baseResult: Omit<AiChatResult, 'status'> = {
    provider: baseUrl.includes('z.ai') ? 'zhipu' : 'custom',
    model,
    session_id: sessionId,
    request_id: requestId,
  };

  // Try each key until one returns 2xx
  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    const started = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept-Language': 'en-US,en',
          'Accept': '*/*',
        },
        body: JSON.stringify({
          model,
          messages: options.messages,
          max_tokens: options.max_tokens || 4096,
          temperature: options.temperature ?? 0.7,
        }),
        signal: AbortSignal.timeout(30000),
      });

      const latency = Date.now() - started;
      const body = await response.json() as Record<string, unknown>;

      if (response.ok) {
        const choices = (body as { choices?: { message: { content: string | null } }[] }).choices;
        const reply = choices?.[0]?.message?.content || '';
        return { ...baseResult, status: 'ok', reply, latency_ms: latency, api_key_index: i };
      }

      // Non-2xx — try next key
      const err = body?.error as { message?: string; type?: string } | undefined;
      baseResult.error_type = err?.type || 'unknown';
      baseResult.error_message = err?.message || `HTTP ${response.status}`;
      baseResult.http_status = response.status;
      baseResult.latency_ms = latency;
      baseResult.api_key_index = i;
    } catch (e: unknown) {
      baseResult.latency_ms = Date.now() - started;
      baseResult.error_message = e instanceof Error ? e.message : 'Network error';
    }
  }

  // All keys exhausted
  return { ...baseResult, status: 'error' };
}
