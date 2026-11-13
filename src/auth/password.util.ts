import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_PREFIX = 'scrypt';
const SALT_BYTES = 16;
const KEY_LEN = 64;

/**
 * Hashes a plaintext password using scrypt and a per-user 16-byte random salt.
 * Matches the storage format used by `prisma/seed.ts`.
 */
export function hashPassword(plainText: string): string {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derivedKey = scryptSync(plainText, salt, KEY_LEN).toString('hex');
  return `${SCRYPT_PREFIX}$${salt}$${derivedKey}`;
}

/**
 * Verifies a plaintext password against a stored `scrypt$<salt>$<hex>` hash
 * using constant-time comparison to prevent timing side channels.
 */
export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (!plainText || !storedHash) {
    return false;
  }

  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== SCRYPT_PREFIX) {
    return false;
  }

  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex || expectedHex.length % 2 !== 0) {
    return false;
  }

  try {
    const expectedBuf = Buffer.from(expectedHex, 'hex');
    const actualBuf = scryptSync(plainText, salt, expectedBuf.length);
    if (actualBuf.length !== expectedBuf.length) {
      return false;
    }
    return timingSafeEqual(actualBuf, expectedBuf);
  } catch {
    return false;
  }
}

