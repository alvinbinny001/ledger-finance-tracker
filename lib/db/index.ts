import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('localhost') ? false : { rejectUnauthorized: true },
  max: 1,
  idleTimeoutMillis: 20_000,
  connectionTimeoutMillis: 10_000,
})
export const db = drizzle(pool, { schema })
