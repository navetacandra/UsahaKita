import { Hono } from 'hono';
import type { Env } from '../types';
import { successResponse, errorResponse } from '../lib/response';
import { authMiddleware, getSession } from '../middleware/auth';
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
    return c.json(errorResponse('VALIDATION_ERROR', 'period_from and period_to are required', 422), 422);
  }

  const tenantDo = getTenantDo(c);

  // Gather analytics context
  const salesMetrics = await tenantDo.getSalesMetrics(period_from, period_to);
  const topProducts = await tenantDo.getTopProducts(5);
  const productionVariance = await tenantDo.getProductionVariance();
  const dashboard = await tenantDo.getDashboardSummary(period_from, period_to);

  // Build context for AI
  const context = {
    period: { from: period_from, to: period_to },
    metrics: salesMetrics,
    top_products: topProducts,
    production_variance: productionVariance,
    low_stock: (dashboard as Record<string, unknown>).low_stock,
  };

  let content: { type: string; title: string; body: string }[] = [];

  // Try AI generation if API key available
  const apiKey = c.env.AI_API_KEY;
  if (apiKey) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Anda adalah asisten bisnis UMKM. Gunakan hanya fakta dari business context. Jangan mengarang angka. Prioritaskan insight yang actionable. Gunakan bahasa Indonesia yang sederhana. Maksimal 3 insight utama. Jika data tidak cukup, nyatakan keterbatasannya. Output dalam format JSON array dengan field: type (WARNING/INFO/POSITIVE), title, body.`,
            },
            {
              role: 'user',
              content: `Business context: ${JSON.stringify(context)}\n\nBuat insight bisnis.`,
            },
          ],
          max_tokens: 500,
        }),
      });

      if (response.ok) {
        const aiResult = await response.json() as { choices: { message: { content: string } }[] };
        const parsed = JSON.parse(aiResult.choices[0].message.content);
        if (Array.isArray(parsed)) {
          content = parsed;
        }
      }
    } catch {
      // Fall through to rule-based
    }
  }

  // Rule-based fallback
  if (content.length === 0) {
    const lowStock = (dashboard as Record<string, Record<string, number>>).low_stock;
    if (lowStock.materials > 0) {
      content.push({
        type: 'WARNING',
        title: `${lowStock.materials} material stok rendah`,
        body: `Ada ${lowStock.materials} material yang stoknya di bawah batas minimum.`,
      });
    }
    if (lowStock.products > 0) {
      content.push({
        type: 'WARNING',
        title: `${lowStock.products} produk stok rendah`,
        body: `Ada ${lowStock.products} produk yang stoknya di bawah batas minimum.`,
      });
    }
    if (content.length === 0) {
      content.push({
        type: 'INFO',
        title: 'Stok dalam kondisi baik',
        body: 'Semua material dan produk memiliki stok yang memadai.',
      });
    }
  }

  const modelMetadata = apiKey
    ? { provider: 'openai', model: 'gpt-4o-mini' }
    : { provider: 'rule-based', model: 'builtin' };

  const insight = await tenantDo.createInsight(period_from, period_to, content, modelMetadata);
  return c.json(successResponse(insight), 201);
});

export default insights;
