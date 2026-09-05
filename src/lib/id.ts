const PREFIXES: Record<string, string> = {
  user: 'usr',
  tenant: 'ten',
  session: 'ses',
  material: 'mat',
  product: 'prd',
  movement: 'mov',
  bom: 'bom',
  production: 'prod',
  sale: 'sale',
  stock_opname: 'opn',
  insight: 'ins',
};

function generateId(type: keyof typeof PREFIXES): string {
  const prefix = PREFIXES[type];
  const random = crypto.getRandomValues(new Uint8Array(8));
  const hex = [...random].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}_${hex}`;
}

export const idGenerator = { generateId };
