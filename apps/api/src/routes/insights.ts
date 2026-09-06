import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';

const insights = new Hono<{ Bindings: Env }>();
insights.use('*', authMiddleware);

insights.get('/', async (c) => {
  const limit = Number(c.req.query('limit')) || 10;

  const tenantDo = getTenantDo(c);
  const result = await tenantDo.listInsights(limit);
  return c.json(successResponse(result.data, result.meta));
});

insights.post('/generate', async (c) => {
  const body = await c.req.json<{ period_from: string; period_to: string }>();
  const { period_from, period_to } = body;

  if (!period_from || !period_to) {
    return c.json(errorResponse('VALIDATION_ERROR', 'period_from and period_to are required'), 422);
  }

  const tenantDo = getTenantDo(c);

  const salesMetrics = await tenantDo.getSalesMetrics(period_from, period_to);
  const topProducts = await tenantDo.getTopProducts(5);
  const productionVariance = await tenantDo.getProductionVariance();
  const dashboard = await tenantDo.getDashboardSummary(period_from, period_to);

  const context = {
    period: { from: period_from, to: period_to },
    metrics: salesMetrics,
    top_products: topProducts,
    production_variance: productionVariance,
    low_stock: (dashboard as Record<string, unknown>).low_stock,
  };

  let content: { type: string; title: string; body: string }[] = [];
  let modelMetadata: Record<string, string> = { provider: 'rule-based', model: 'builtin' };
  let aiError = '';

  // Configurable AI provider — swap via env vars AI_BASE_URL, AI_MODEL, AI_API_KEY
  const aiBaseUrl = (c.env.AI_BASE_URL || 'https://opencode.ai').replace(/\/+$/, '');
  const aiModel = c.env.AI_MODEL || 'mimo-v2.5-free';
  const aiApiKey = c.env.AI_API_KEY || 'Bearer public';

  try {
    const sessionId = `ses_${crypto.randomUUID().replace(/-/g, '')}`;
    const requestId = `msg_${crypto.randomUUID().replace(/-/g, '')}`;

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
        messages: [
          {
            role: 'user',
            content: `Return ONLY a JSON array. No markdown, no explanation. Format: [{"type":"INFO","title":"short title","body":"insight text"}]. Types: WARNING/INFO/POSITIVE. Max 3 items. Business data: ${JSON.stringify(context)}`,
          },
        ],
        max_tokens: 8192,
        temperature: 0.3,
      }),
    });

    const resBody = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const errObj = resBody?.error as { message?: string } | undefined;
      aiError = errObj?.message || `HTTP ${response.status}`;
    } else {
      const choices = (resBody as { choices?: { message: { content: string | null; reasoning_content?: string | null } }[] }).choices;
      const msg = choices?.[0]?.message;
      const raw = msg?.content || msg?.reasoning_content || '';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          content = parsed.filter((item: { type?: string; title?: string; body?: string }) =>
            item.type && item.title && item.body
          );
          if (content.length > 0) {
            modelMetadata = { provider: aiBaseUrl.includes('opencode') ? 'opencode' : 'custom', model: aiModel };
          }
        }
      }
    }
  } catch (e: unknown) {
    aiError = e instanceof Error ? e.message : 'Network error';
  }

  if (content.length === 0) {
    const body = aiError
      ? `AI provider tidak tersedia: ${aiError}. Coba lagi nanti.`
      : 'Jalankan generate ulang atau periksa koneksi AI provider.';
    content.push({ type: 'INFO', title: 'Belum ada insight', body });
  }

  const insight = await tenantDo.createInsight(period_from, period_to, content, modelMetadata);
  return c.json(successResponse({ ...insight, ai_error: aiError || undefined }), 201);
});

export default insights;
