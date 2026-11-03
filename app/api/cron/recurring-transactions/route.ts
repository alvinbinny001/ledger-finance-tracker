import { timingSafeEqual } from 'node:crypto'
import { pool } from '@/lib/db'
import { decryptForUser, encryptForUser } from '@/lib/crypto'
import { currentIndiaDate } from '@/lib/finance'

export const dynamic = 'force-dynamic'

type DueRule = {
  id: number
  userId: string
  type: 'income' | 'expense'
  category: string
  payload: string
  dayOfMonth: number
  nextRunDate: string
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const supplied = request.headers.get('authorization') ?? ''
  const expected = `Bearer ${secret}`
  const suppliedBytes = Buffer.from(supplied)
  const expectedBytes = Buffer.from(expected)
  return (
    suppliedBytes.length === expectedBytes.length &&
    timingSafeEqual(suppliedBytes, expectedBytes)
  )
}

function nextMonthlyDate(currentDate: string, dayOfMonth: number) {
  const current = new Date(`${currentDate}T00:00:00.000Z`)
  let year = current.getUTCFullYear()
  let month = current.getUTCMonth() + 1
  if (month > 11) {
    month = 0
    year += 1
  }
  const day = Math.min(dayOfMonth, new Date(Date.UTC(year, month + 1, 0)).getUTCDate())
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: 'Scheduled transaction secret is not configured.' }, { status: 503 })
  }
  if (!authorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const today = currentIndiaDate()
    const due = await client.query<DueRule>(
      `SELECT id, "userId", type, category, payload, "dayOfMonth", "nextRunDate"::text
       FROM recurring_transactions
       WHERE active = TRUE AND "nextRunDate" <= $1::date
       ORDER BY "nextRunDate", id
       LIMIT 100
       FOR UPDATE SKIP LOCKED`,
      [today],
    )

    let created = 0
    for (const rule of due.rows) {
      const { amount, note } = decryptForUser<{ amount: number; note: string }>(
        rule.userId,
        rule.payload,
      )
      const occurrenceDate = rule.nextRunDate
      await client.query(
        `INSERT INTO transactions ("userId", type, payload, "occurredAt")
         VALUES ($1, $2, $3, $4::date)`,
        [
          rule.userId,
          rule.type,
          encryptForUser(rule.userId, { amount, category: rule.category, note }),
          occurrenceDate,
        ],
      )
      await client.query(
        `UPDATE recurring_transactions
         SET "nextRunDate" = $1::date
         WHERE id = $2`,
        [nextMonthlyDate(occurrenceDate, rule.dayOfMonth), rule.id],
      )
      created += 1
    }

    await client.query('COMMIT')
    return Response.json({ created })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Scheduled recurring transaction run failed:', error)
    return Response.json({ error: 'Scheduled transactions could not be processed.' }, { status: 500 })
  } finally {
    client.release()
  }
}
