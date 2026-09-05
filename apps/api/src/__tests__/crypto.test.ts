import { describe, it, expect } from 'vitest';
import { cryptoUtils } from '../lib/crypto';

describe('cryptoUtils', () => {
  describe('toHex / fromHex', () => {
    it('converts ArrayBuffer to hex string and back', () => {
      const bytes = new Uint8Array([0x00, 0x0f, 0xff, 0xa0]);
      const hex = cryptoUtils.toHex(bytes.buffer);
      expect(hex).toBe('000fffa0');
      const roundtrip = cryptoUtils.fromHex(hex);
      expect([...roundtrip]).toEqual([0x00, 0x0f, 0xff, 0xa0]);
    });

    it('produces even-length hex strings', () => {
      const bytes = new Uint8Array([0x01, 0x02, 0x03]);
      const hex = cryptoUtils.toHex(bytes.buffer);
      expect(hex.length % 2).toBe(0);
    });
  });

  describe('generateSalt', () => {
    it('returns a 32-char hex string (16 bytes)', () => {
      const salt = cryptoUtils.generateSalt();
      expect(salt).toMatch(/^[0-9a-f]{32}$/);
    });

    it('generates unique salts', () => {
      const salt1 = cryptoUtils.generateSalt();
      const salt2 = cryptoUtils.generateSalt();
      expect(salt1).not.toBe(salt2);
    });
  });

  describe('generateToken', () => {
    it('returns a 64-char hex string (32 bytes)', () => {
      const token = cryptoUtils.generateToken();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('generates unique tokens', () => {
      const t1 = cryptoUtils.generateToken();
      const t2 = cryptoUtils.generateToken();
      expect(t1).not.toBe(t2);
    });
  });

  describe('hashPassword', () => {
    it('returns hash and salt', async () => {
      const result = await cryptoUtils.hashPassword('mypassword');
      expect(result.hash).toMatch(/^[0-9a-f]{128}$/);
      expect(result.salt).toMatch(/^[0-9a-f]{32}$/);
    });

    it('produces consistent hashes with same salt', async () => {
      const salt = 'testsalt123';
      const r1 = await cryptoUtils.hashPassword('password', salt);
      const r2 = await cryptoUtils.hashPassword('password', salt);
      expect(r1.hash).toBe(r2.hash);
      expect(r1.salt).toBe(salt);
    });

    it('produces different hashes for different passwords', async () => {
      const salt = 'testsalt123';
      const r1 = await cryptoUtils.hashPassword('password1', salt);
      const r2 = await cryptoUtils.hashPassword('password2', salt);
      expect(r1.hash).not.toBe(r2.hash);
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', async () => {
      const { hash, salt } = await cryptoUtils.hashPassword('correct123');
      const valid = await cryptoUtils.verifyPassword('correct123', hash, salt);
      expect(valid).toBe(true);
    });

    it('returns false for wrong password', async () => {
      const { hash, salt } = await cryptoUtils.hashPassword('correct123');
      const valid = await cryptoUtils.verifyPassword('wrong123', hash, salt);
      expect(valid).toBe(false);
    });
  });

  describe('hashTokenAsync', () => {
    it('returns a 64-char hex SHA-256 hash', async () => {
      const hash = await cryptoUtils.hashTokenAsync('test-token');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is deterministic', async () => {
      const h1 = await cryptoUtils.hashTokenAsync('same-input');
      const h2 = await cryptoUtils.hashTokenAsync('same-input');
      expect(h1).toBe(h2);
    });

    it('produces different hashes for different inputs', async () => {
      const h1 = await cryptoUtils.hashTokenAsync('token-a');
      const h2 = await cryptoUtils.hashTokenAsync('token-b');
      expect(h1).not.toBe(h2);
    });
  });
});
