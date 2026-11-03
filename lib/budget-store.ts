import { and, eq } from 'drizzle-orm'
import { decryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { budgets } from '@/lib/db/schema'

export type BudgetLimit = {
  id: number
  category: string
  limit: number
}

export async function getBudgetsForUser(
  userId: string,
  month: string,
): Promise<BudgetLimit[]> {
  const rows = await db
    .select()
    .from(budgets)
    .where(and(eq(budgets.userId, userId), eq(budgets.month, month)))

  return rows.map((row) => {
    const data = decryptForUser<{ limit: number }>(userId, row.payload)
    return { id: row.id, category: row.category, limit: data.limit }
  })
}
