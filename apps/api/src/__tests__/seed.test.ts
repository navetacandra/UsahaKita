import { describe, it, expect } from 'vitest';
import { getAuthSeedSQL, getTenantSeedSQL } from '../lib/seed';

describe('getAuthSeedSQL', () => {
  it('returns an array of SQL statements', () => {
    const sql = getAuthSeedSQL();
    expect(Array.isArray(sql)).toBe(true);
    expect(sql.length).toBeGreaterThan(0);
  });

  it('contains INSERT statements for users, tenants, tenant_members', () => {
    const sql = getAuthSeedSQL();
    const joined = sql.join(' ');
    expect(joined).toContain('INSERT');
    expect(joined).toContain('users');
    expect(joined).toContain('tenants');
    expect(joined).toContain('tenant_members');
  });

  it('references usr_01 and ten_01', () => {
    const sql = getAuthSeedSQL();
    const joined = sql.join(' ');
    expect(joined).toContain("'usr_01'");
    expect(joined).toContain("'ten_01'");
  });
});

describe('getTenantSeedSQL', () => {
  it('returns an array of SQL statements', () => {
    const sql = getTenantSeedSQL();
    expect(Array.isArray(sql)).toBe(true);
    expect(sql.length).toBeGreaterThan(0);
  });

  it('covers all business tables', () => {
    const sql = getTenantSeedSQL();
    const joined = sql.join(' ');
    expect(joined).toContain('materials');
    expect(joined).toContain('products');
    expect(joined).toContain('boms');
    expect(joined).toContain('productions');
    expect(joined).toContain('sales');
    expect(joined).toContain('ai_insights');
  });

  it('references correct IDs (mat_01..mat_05, prd_01..prd_02)', () => {
    const sql = getTenantSeedSQL();
    const joined = sql.join(' ');
    for (let i = 1; i <= 5; i++) {
      expect(joined).toContain(`'mat_0${i}'`);
    }
    expect(joined).toContain("'prd_01'");
    expect(joined).toContain("'prd_02'");
  });

  it('all statements are valid SQL (basic syntax check)', () => {
    const sql = getTenantSeedSQL();
    for (const stmt of sql) {
      expect(stmt.trim().toUpperCase()).toMatch(/^INSERT/);
    }
  });
});
