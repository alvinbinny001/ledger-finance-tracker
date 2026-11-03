import { and, desc, eq } from 'drizzle-orm'
import { decryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import type { Transaction, TransactionType } from '@/lib/finance'

type EncryptedTransaction = { amount: number; category: string; note: string }

export async function getTransactionsForUser(userId: string): Promise<Transaction[]> {
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))

  const result: Transaction[] = []
  for (const row of rows) {
    try {
      const data = decryptForUser<EncryptedTransaction>(userId, row.payload)
      result.push({
        id: row.id,
        type: row.type as TransactionType,
        amount: data.amount,
        category: data.category,
        note: data.note,
        occurredAt: row.occurredAt,
      })
    } catch (error) {
      console.error('Failed to decrypt transaction', row.id, error)
    }
  }
  return result
}
