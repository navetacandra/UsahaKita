import { DurableObject } from 'cloudflare:workers';
import { cryptoUtils } from '../lib/crypto';
import { idGenerator } from '../lib/id';


export class AuthDirectoryDO extends DurableObject {
  private sql!: SqlStorage;

  constructor(state: DurableObjectState, env: unknown) {
    super(state, env);
    this.sql = state.storage.sql;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.sql.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS tenant_members (
        tenant_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'OWNER',
        created_at TEXT NOT NULL,
        PRIMARY KEY (tenant_id, user_id)
      );
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        tenant_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        revoked_at TEXT
      );
    `);
  }

  async findUserByEmail(email: string): Promise<Record<string, SqlStorageValue> | null> {
    try {
      return this.sql.exec('SELECT * FROM users WHERE email = ?', email).one();
    } catch {
      return null;
    }
  }

  async findUserById(id: string): Promise<Record<string, SqlStorageValue> | null> {
    try {
      return this.sql.exec('SELECT * FROM users WHERE id = ?', id).one();
    } catch {
      return null;
    }
  }

  async createUser(email: string, password: string, businessName: string, businessDescription: string): Promise<{
    user: { id: string; email: string };
    tenant: { id: string; name: string; description: string };
  }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const existing = await this.findUserByEmail(email);
      if (existing) {
        throw new Error('EMAIL_ALREADY_EXISTS');
      }

      const userId = idGenerator.generateId('user');
      const tenantId = idGenerator.generateId('tenant');
      const now = new Date().toISOString();
      const { hash, salt } = await cryptoUtils.hashPassword(password);

      this.sql.exec(
        'INSERT INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)',
        userId, email, hash, salt, now,
      );

      this.sql.exec(
        'INSERT INTO tenants (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        tenantId, businessName, businessDescription || '', now, now,
      );

      this.sql.exec(
        'INSERT INTO tenant_members (tenant_id, user_id, role, created_at) VALUES (?, ?, ?, ?)',
        tenantId, userId, 'OWNER', now,
      );

      return {
        user: { id: userId, email },
        tenant: { id: tenantId, name: businessName, description: businessDescription || '' },
      };
    });
  }

  async verifyLogin(email: string, password: string): Promise<{
    user: { id: string; email: string };
    tenant: { id: string; name: string; description: string };
  } | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const valid = await cryptoUtils.verifyPassword(password, user.password_hash as string, user.password_salt as string);
    if (!valid) return null;

    let membership: Record<string, SqlStorageValue>;
    try {
      membership = this.sql.exec(
        'SELECT t.* FROM tenants t JOIN tenant_members tm ON t.id = tm.tenant_id WHERE tm.user_id = ?',
        user.id as string,
      ).one();
    } catch {
      return null;
    }

    if (!membership) return null;

    return {
      user: { id: user.id as string, email: user.email as string },
      tenant: {
        id: membership.id as string,
        name: membership.name as string,
        description: (membership.description as string) || '',
      },
    };
  }

  async createSession(userId: string, tenantId: string): Promise<{ sessionId: string; token: string }> {
    const sessionId = idGenerator.generateId('session');
    const token = cryptoUtils.generateToken();
    const tokenHash = await cryptoUtils.hashTokenAsync(token);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    this.sql.exec(
      'INSERT INTO sessions (id, user_id, tenant_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      sessionId, userId, tenantId, tokenHash, expiresAt, now.toISOString(),
    );

    return { sessionId, token };
  }

  async validateSession(token: string): Promise<{ userId: string; tenantId: string; sessionId: string } | null> {
    const tokenHash = await cryptoUtils.hashTokenAsync(token);
    let session: Record<string, SqlStorageValue>;
    try {
      session = this.sql.exec(
        'SELECT * FROM sessions WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?',
        tokenHash, new Date().toISOString(),
      ).one();
    } catch {
      return null;
    }

    if (!session) return null;

    return {
      userId: session.user_id as string,
      tenantId: session.tenant_id as string,
      sessionId: session.id as string,
    };
  }

  async revokeSession(sessionId: string): Promise<void> {
    this.sql.exec('UPDATE sessions SET revoked_at = ? WHERE id = ?', new Date().toISOString(), sessionId);
  }

  async getUserTenants(userId: string): Promise<Record<string, SqlStorageValue>[]> {
    return this.sql.exec(
      'SELECT t.* FROM tenants t JOIN tenant_members tm ON t.id = tm.tenant_id WHERE tm.user_id = ?',
      userId,
    ).toArray();
  }

  async getTenantById(tenantId: string): Promise<Record<string, SqlStorageValue> | null> {
    try {
      return this.sql.exec('SELECT * FROM tenants WHERE id = ?', tenantId).one();
    } catch {
      return null;
    }
  }

  async updateTenant(tenantId: string, name?: string, description?: string): Promise<void> {
    const now = new Date().toISOString();
    if (name !== undefined) {
      this.sql.exec('UPDATE tenants SET name = ?, updated_at = ? WHERE id = ?', name, now, tenantId);
    }
    if (description !== undefined) {
      this.sql.exec('UPDATE tenants SET description = ?, updated_at = ? WHERE id = ?', description, now, tenantId);
    }
  }

  async seed(force = false): Promise<{ seeded: boolean; message: string; counts: Record<string, number> }> {
    const existing = this.sql.exec('SELECT COUNT(*) as count FROM users').one();
    const userCount = Number(existing.count);
    if (userCount > 0 && !force) {
      return { seeded: false, message: 'Auth database already seeded', counts: { users: userCount } };
    }

    if (force) {
      this.sql.exec('DELETE FROM tenant_members');
      this.sql.exec('DELETE FROM sessions');
      this.sql.exec('DELETE FROM tenants');
      this.sql.exec('DELETE FROM users');
    }

    const defaultPassword = 'password123';
    const { hash, salt } = await cryptoUtils.hashPassword(defaultPassword);

    this.sql.exec(
      `INSERT OR IGNORE INTO users (id, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?)`,
      'usr_01', 'owner@tokomaju.com', hash, salt, '2026-09-05T08:00:00.000Z',
    );

    this.sql.exec(
      `INSERT OR IGNORE INTO tenants (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
      'ten_01', 'Toko Maju', 'Usaha produksi dan penjualan makanan rumahan', '2026-09-05T08:00:00.000Z', '2026-09-05T08:00:00.000Z',
    );

    this.sql.exec(
      `INSERT OR IGNORE INTO tenant_members (tenant_id, user_id, role, created_at) VALUES (?, ?, ?, ?)`,
      'ten_01', 'usr_01', 'OWNER', '2026-09-05T08:00:00.000Z',
    );

    const users = Number(this.sql.exec('SELECT COUNT(*) as count FROM users').one().count);
    const tenants = Number(this.sql.exec('SELECT COUNT(*) as count FROM tenants').one().count);
    const members = Number(this.sql.exec('SELECT COUNT(*) as count FROM tenant_members').one().count);

    return {
      seeded: true,
      message: 'Auth seed data inserted successfully',
      counts: { users, tenants, tenant_members: members },
    };
  }
}
