'use server'

import { and, eq, sql } from 'drizzle-orm'
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
import type { ImportedTransaction } from '@/lib/bank-csv'
import { getTransactionsForUser } from '@/lib/transaction-store'

export type ActionState = { error?: string; success?: boolean }

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getTransactions(): Promise<Transaction[]> {
  return getTransactionsForUser(await getUserId())
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

function isValidImportRow(row: ImportedTransaction) {
  const categories: readonly string[] =
    row.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const date = new Date(`${row.occurredAt}T00:00:00.000Z`)
  return (
    (row.type === 'income' || row.type === 'expense') &&
    Number.isFinite(row.amount) &&
    row.amount > 0 &&
    row.amount <= 1_000_000_000 &&
    categories.includes(row.category) &&
    typeof row.note === 'string' &&
    row.note.trim().length > 0 &&
    row.note.length <= 140 &&
    /^\d{4}-\d{2}-\d{2}$/.test(row.occurredAt) &&
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === row.occurredAt
  )
}

function transactionSignature(transaction: ImportedTransaction) {
  return [
    transaction.occurredAt,
    transaction.type,
    Math.round(transaction.amount * 100),
    transaction.note.trim().toLowerCase(),
  ].join('\u0000')
}

function signaturesFromRows(
  userId: string,
  rows: { type: string; occurredAt: string; payload: string }[],
) {
  const signatures = new Set<string>()

  for (const row of rows) {
    try {
      const payload = decryptForUser<{ amount: number; category: string; note: string }>(
        userId,
        row.payload,
      )
      signatures.add(
        transactionSignature({
          type: row.type as TransactionType,
          amount: payload.amount,
          category: payload.category,
          note: payload.note,
          occurredAt: row.occurredAt,
        }),
      )
    } catch (error) {
      console.error('Failed to inspect transaction for import duplicates', error)
    }
  }
  return signatures
}

async function getExistingSignatures(userId: string) {
  const rows = await db
    .select({
      type: transactions.type,
      occurredAt: transactions.occurredAt,
      payload: transactions.payload,
    })
    .from(transactions)
    .where(eq(transactions.userId, userId))
  return signaturesFromRows(userId, rows)
}

function validateImportRows(rows: ImportedTransaction[]) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
    throw new Error('Import between 1 and 500 transactions at a time.')
  }
  if (rows.some((row) => !row || !isValidImportRow(row))) {
    throw new Error('One or more imported transactions are invalid. Review the CSV and try again.')
  }
}

export async function previewImportedTransactions(rows: ImportedTransaction[]) {
  const userId = await getUserId()
  validateImportRows(rows)
  const signatures = await getExistingSignatures(userId)
  const seen = new Set<string>()

  return rows.flatMap((row, index) => {
    const signature = transactionSignature(row)
    const duplicate = signatures.has(signature) || seen.has(signature)
    seen.add(signature)
    return duplicate ? [index] : []
  })
}

export async function importTransactions(
  rows: ImportedTransaction[],
  includeDuplicateIndexes: number[] = [],
) {
  const userId = await getUserId()
  validateImportRows(rows)
  if (
    !Array.isArray(includeDuplicateIndexes) ||
    includeDuplicateIndexes.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= rows.length,
    )
  ) {
    throw new Error('The duplicate selection is invalid. Review the import and try again.')
  }
  const includeDuplicates = new Set(includeDuplicateIndexes)
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId}))`)
    const existingRows = await tx
      .select({
        type: transactions.type,
        occurredAt: transactions.occurredAt,
        payload: transactions.payload,
      })
      .from(transactions)
      .where(eq(transactions.userId, userId))
    const signatures = signaturesFromRows(userId, existingRows)
    const uniqueRows: ImportedTransaction[] = []
    let duplicates = 0

    for (const [index, row] of rows.entries()) {
      const signature = transactionSignature(row)
      if (signatures.has(signature) && !includeDuplicates.has(index)) {
        duplicates += 1
        continue
      }
      if (!includeDuplicates.has(index)) signatures.add(signature)
      uniqueRows.push(row)
    }

    if (uniqueRows.length > 0) {
      await tx.insert(transactions).values(
        uniqueRows.map((row) => ({
          userId,
          type: row.type,
          occurredAt: row.occurredAt,
          payload: encryptForUser(userId, {
            amount: Math.round(row.amount * 100) / 100,
            category: row.category,
            note: row.note.trim(),
          }),
        })),
      )
    }

    return { imported: uniqueRows.length, duplicates }
  })

  revalidatePath('/dashboard')
  return result
}
