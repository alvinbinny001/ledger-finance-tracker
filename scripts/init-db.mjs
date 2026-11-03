import { Pool } from 'pg'
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL or DATABASE_URL_POOLED must be set before initializing the database')
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true },
  max: 1,
  connectionTimeoutMillis: 10_000,
})

async function main() {
  console.log('Connecting to PostgreSQL...')
  const client = await pool.connect()
  try {
    console.log('Creating tables if they do not exist...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" BOOLEAN NOT NULL DEFAULT false,
        image TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "session" (
        id TEXT PRIMARY KEY,
        "expiresAt" TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS "account" (
        id TEXT PRIMARY KEY,
        "accountId" TEXT NOT NULL,
        "providerId" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        "accessToken" TEXT,
        "refreshToken" TEXT,
        "idToken" TEXT,
        "accessTokenExpiresAt" TIMESTAMP,
        "refreshTokenExpiresAt" TIMESTAMP,
        scope TEXT,
        password TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS "transactions" (
        id SERIAL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        type TEXT NOT NULL,
        payload TEXT NOT NULL,
        "occurredAt" DATE NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `)
    const migrationUrl = new URL('./migrations/001-finance-features.sql', import.meta.url)
    const migration = await readFile(fileURLToPath(migrationUrl), 'utf8')
    await client.query(migration)
    console.log('Database tables initialized successfully!')
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((err) => {
  console.error('Migration error:', err.message)
  process.exit(1)
})
