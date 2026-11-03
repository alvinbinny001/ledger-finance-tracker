import { and, eq } from 'drizzle-orm'
import { decryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { recurringTransactions } from '@/lib/db/schema'
import type { TransactionType } from '@/lib/finance'

export type RecurringRule = {
  id: number
  type: TransactionType
  category: string
  amount: number
  note: string
  dayOfMonth: number
  nextRunDate: string
}

export async function getRecurringRulesForUser(
  userId: string,
): Promise<RecurringRule[]> {
  const rows = await db
    .select()
    .from(recurringTransactions)
    .where(and(eq(recurringTransactions.userId, userId), eq(recurringTransactions.active, true)))
    .orderBy(recurringTransactions.nextRunDate)

  return rows.map((row) => {
    const data = decryptForUser<{ amount: number; note: string }>(userId, row.payload)
    return {
      id: row.id,
      type: row.type as TransactionType,
      category: row.category,
      amount: data.amount,
      note: data.note,
      dayOfMonth: row.dayOfMonth,
      nextRunDate: row.nextRunDate,
    }
  })
}
