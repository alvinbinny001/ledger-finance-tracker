import { createCipheriv, createDecipheriv, hkdfSync, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const VERSION = 'v1'

function getMasterSecret() {
  const secret = process.env.ENCRYPTION_KEY ?? process.env.BETTER_AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('Encryption secret is missing or shorter than 32 characters')
  }
  return secret
}

// Each user gets their own derived key, so one user's ciphertext can never be
// decrypted with another user's key even if rows were moved between accounts.
function deriveUserKey(userId: string) {
  return Buffer.from(
    hkdfSync('sha256', getMasterSecret(), 'ledger-transactions', `user:${userId}`, 32),
  )
}

export function encryptForUser(userId: string, data: unknown) {
  const iv = randomBytes(12)
  const cipher = createCipheriv(ALGORITHM, deriveUserKey(userId), iv)
  cipher.setAAD(Buffer.from(userId))
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [VERSION, iv, tag, ciphertext]
    .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
    .join('.')
}

export function decryptForUser<T>(userId: string, payload: string): T {
  const [version, iv, tag, ciphertext] = payload.split('.')
  if (version !== VERSION || !iv || !tag || !ciphertext) {
    throw new Error('Unsupported payload format')
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    deriveUserKey(userId),
    Buffer.from(iv, 'base64url'),
  )
  decipher.setAAD(Buffer.from(userId))
  decipher.setAuthTag(Buffer.from(tag, 'base64url'))
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, 'base64url')),
    decipher.final(),
  ])
  return JSON.parse(plaintext.toString('utf8')) as T
}
