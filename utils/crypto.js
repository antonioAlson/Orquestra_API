import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function requireSecret() {
  const s = process.env.JIRA_TOKEN_SECRET;
  if (!s || s.length !== 64) {
    throw new Error('JIRA_TOKEN_SECRET must be 64 hex characters (32 bytes)');
  }
  return s;
}

/**
 * Decrypt a Jira API token stored in the database.
 * Format stored: `<iv_hex>:<ciphertext_hex>` (AES-256-GCM without auth tag,
 * matching the encrypt function in authController.js).
 *
 * Returns null on any failure — callers must handle the null case.
 * @param {string | null} text
 * @returns {string | null}
 */
export function decrypt(text) {
  try {
    if (!text) return null;
    const secret = requireSecret();
    const parts = text.split(':');
    if (parts.length < 2) return null;
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(secret, 'hex'), iv);
    // Tokens were stored without an auth tag (encrypt never called getAuthTag).
    // Calling decipher.final() on Node 18+ throws AuthTagRequired in GCM mode.
    // update() alone returns all plaintext for GCM (stream cipher — no buffering).
    return decipher.update(encryptedText).toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Encrypt a plaintext string for storage.
 * Format: `<iv_hex>:<ciphertext_hex>`
 * @param {string | null} text
 * @returns {string | null}
 */
export function encrypt(text) {
  if (!text) return null;
  const secret = requireSecret();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secret, 'hex'), iv);
  const encrypted = Buffer.concat([cipher.update(Buffer.from(text, 'utf8')), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}
