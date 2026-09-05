const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'SHA-256';

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

function generateSalt(): string {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return toHex(salt.buffer);
}

function generateToken(): string {
  const token = new Uint8Array(32);
  crypto.getRandomValues(token);
  return toHex(token.buffer);
}

async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const actualSalt = salt || generateSalt();
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(actualSalt),
      iterations: ITERATIONS,
      hash: DIGEST,
    },
    keyMaterial,
    KEY_LENGTH * 8,
  );
  return { hash: toHex(bits), salt: actualSalt };
}

async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: computedHash } = await hashPassword(password, salt);
  return computedHash === hash;
}

function hashToken(token: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  // Use a simpler approach - just hash with SHA-256 synchronously not possible
  // so we use the token directly and hash it via a promise
  return token; // We'll hash it async below
}

async function hashTokenAsync(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return toHex(hashBuffer);
}

export const cryptoUtils = {
  generateSalt,
  generateToken,
  hashPassword,
  verifyPassword,
  hashTokenAsync,
  toHex,
  fromHex,
};
