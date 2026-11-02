'use server'

import { and, desc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { decryptForUser, encryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type Transaction,
  type TransactionType,
} from '@/lib/finance'

type EncryptedPayload = { amount: number; category: string; note: string }

export type ActionState = { error?: string; success?: boolean }

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getTransactions(): Promise<Transaction[]> {
  const userId = await getUserId()
  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.occurredAt), desc(transactions.id))

  const result: Transaction[] = []
  for (const row of rows) {
    try {
      const data = decryptForUser<EncryptedPayload>(userId, row.payload)
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

export async function addTransaction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await getUserId()

  const type = formData.get('type')
  const amountRaw = Number(formData.get('amount'))
  const category = String(formData.get('category') ?? '')
  const note = String(formData.get('note') ?? '').trim().slice(0, 140)
  const occurredAt = String(formData.get('occurredAt') ?? '')

  if (type !== 'income' && type !== 'expense') {
    return { error: 'Choose income or expense.' }
  }
  if (!Number.isFinite(amountRaw) || amountRaw <= 0 || amountRaw > 1_000_000_000) {
    return { error: 'Enter an amount greater than 0.' }
  }
  const allowed: readonly string[] =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  if (!allowed.includes(category)) {
    return { error: 'Pick a category.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredAt) || Number.isNaN(Date.parse(occurredAt))) {
    return { error: 'Enter a valid date.' }
  }

  const amount = Math.round(amountRaw * 100) / 100

  await db.insert(transactions).values({
    userId,
    type,
    occurredAt,
    payload: encryptForUser(userId, { amount, category, note }),
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTransaction(id: number) {
  const userId = await getUserId()
  if (!Number.isInteger(id)) return
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  revalidatePath('/dashboard')
}
