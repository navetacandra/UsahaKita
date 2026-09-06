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

  // Configurable AI provider — swap via env vars AI_BASE_URL, AI_MODEL, AI_API_KEY
  const aiBaseUrl = (c.env.AI_BASE_URL || 'https://opencode.ai').replace(/\/+$/, '');
  const aiModel = c.env.AI_MODEL || 'mimo-v2.5-free';
  const aiApiKey = c.env.AI_API_KEY || 'Bearer public';

  try {
    const response = await fetch(`${aiBaseUrl}/zen/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': aiApiKey,
        'x-opencode-client': 'usahakita',
        'x-opencode-project': 'global',
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: `Anda adalah asisten bisnis UMKM. Gunakan hanya fakta dari business context. Jangan mengarang angka. Prioritaskan insight yang actionable. Gunakan bahasa Indonesia yang sederhana. Maksimal 3 insight utama. Jika data tidak cukup, nyatakan keterbatasannya. Output HANYA JSON array dengan field: type (WARNING/INFO/POSITIVE), title, body. Tanpa markdown, tanpa penjelasan tambahan.`,
          },
          {
            role: 'user',
            content: `Business context: ${JSON.stringify(context)}\n\nBuat insight bisnis dalam format JSON array.`,
          },
        ],
        max_tokens: 2048,
      }),
    });

    if (response.ok) {
      const aiResult = await response.json() as {
        choices: { message: { content: string | null; reasoning_content?: string | null } }[];
      };
      const msg = aiResult.choices[0].message;
      // Some models put output in reasoning_content when content is null
      const raw = msg.content || msg.reasoning_content || '';
      // Extract JSON array — handle markdown code blocks if present
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          content = parsed;
          modelMetadata = { provider: aiBaseUrl.includes('opencode') ? 'opencode' : 'custom', model: aiModel };
        }
      }
    }
  } catch {
    // AI unavailable — content stays empty
  }

  if (content.length === 0) {
    content.push({
      type: 'INFO',
      title: 'Belum ada insight',
      body: 'Jalankan generate ulang atau periksa koneksi AI provider.',
    });
  }

  const insight = await tenantDo.createInsight(period_from, period_to, content, modelMetadata);
  return c.json(successResponse(insight), 201);
});

export default insights;
