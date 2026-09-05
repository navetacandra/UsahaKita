import { describe, it, expect } from 'vitest';
import { idGenerator } from '../lib/id';

describe('idGenerator', () => {
  const types = [
    'user', 'tenant', 'session', 'material', 'product',
    'movement', 'bom', 'production', 'sale', 'stock_opname', 'insight',
  ] as const;

  const expectedPrefixes: Record<string, string> = {
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

  for (const type of types) {
    it(`generates ${type} ID with correct prefix`, () => {
      const id = idGenerator.generateId(type);
      expect(id).toMatch(new RegExp(`^${expectedPrefixes[type]}_[0-9a-f]{16}$`));
    });
  }

  it('generates unique IDs of same type', () => {
    const ids = new Set(Array.from({ length: 100 }, () => idGenerator.generateId('user')));
    expect(ids.size).toBe(100);
  });

  it('generates IDs with 16 hex chars after prefix', () => {
    const id = idGenerator.generateId('material');
    const hexPart = id.split('_')[1];
    expect(hexPart).toHaveLength(16);
    expect(hexPart).toMatch(/^[0-9a-f]+$/);
  });
});
