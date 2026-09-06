import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware } from '../middleware/auth';
import { getTenantDo } from '../middleware/tenant';
import { aiChat } from '../lib/ai';

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

  const aiResult = await aiChat(c.env, {
    messages: [
      {
        role: 'user',
        content: `You are a business analyst for a UMKM (small business). Analyze the following business data and return insights.

Business Context:
- Period: ${context.period.from} to ${context.period.to}
- Sales: ${JSON.stringify(context.metrics)}
- Top Products: ${JSON.stringify(context.top_products)}
- Production Variance: ${JSON.stringify(context.production_variance)}
- Low Stock: ${JSON.stringify(context.low_stock)}

Return ONLY a JSON array. No markdown, no explanation. Format: [{"type":"INFO","title":"short title","body":"insight text"}]. Types: WARNING/INFO/POSITIVE. Max 3 items. All titles and body text MUST be in Bahasa Indonesia.`,
      },
    ],
    max_tokens: 4096,
    temperature: 0.3,
  });

  if (aiResult.status === 'ok' && aiResult.reply) {
    const jsonMatch = aiResult.reply.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        content = parsed.filter((item: { type?: string; title?: string; body?: string }) =>
          item.type && item.title && item.body
        );
        if (content.length > 0) {
          modelMetadata = {
            provider: aiResult.provider,
            model: aiResult.model,
            key_index: String(aiResult.api_key_index ?? 0),
          };
        }
      }
    }
  }

  if (content.length === 0) {
    const errMsg = aiResult.error_message || 'Jalankan generate ulang atau periksa koneksi AI provider.';
    content.push({ type: 'INFO', title: 'Belum ada insight', body: errMsg });
  }

  const insight = await tenantDo.createInsight(period_from, period_to, content, modelMetadata);
  return c.json(successResponse({
    ...insight,
    ai: {
      status: aiResult.status,
      latency_ms: aiResult.latency_ms,
      key_index: aiResult.api_key_index,
      error: aiResult.error_message || undefined,
    },
  }), 201);
});

export default insights;
