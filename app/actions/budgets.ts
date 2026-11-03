'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { encryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { budgets } from '@/lib/db/schema'
import { EXPENSE_CATEGORIES } from '@/lib/finance'
import type { BudgetLimit } from '@/lib/budget-store'
import { getBudgetsForUser } from '@/lib/budget-store'

export type BudgetActionState = { error?: string; success?: boolean }

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

function isValidMonth(month: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
}

export async function getMonthlyBudgets(month: string): Promise<BudgetLimit[]> {
  if (!isValidMonth(month)) throw new Error('Invalid budget month')
  return getBudgetsForUser(await getUserId(), month)
}

export async function saveMonthlyBudget(
  _previous: BudgetActionState,
  formData: FormData,
): Promise<BudgetActionState> {
  const userId = await getUserId()
  const category = String(formData.get('category') ?? '')
  const month = String(formData.get('month') ?? '')
  const limit = Number(formData.get('limit'))

  if (!(EXPENSE_CATEGORIES as readonly string[]).includes(category)) {
    return { error: 'Choose a valid expense category.' }
  }
  if (!isValidMonth(month)) return { error: 'Choose a valid month.' }
  if (!Number.isFinite(limit) || limit <= 0 || limit > 1_000_000_000) {
    return { error: 'Enter a budget greater than ₹0.' }
  }

  await db
    .insert(budgets)
    .values({
      userId,
      category,
      month,
      payload: encryptForUser(userId, { limit: Math.round(limit * 100) / 100 }),
    })
    .onConflictDoUpdate({
      target: [budgets.userId, budgets.category, budgets.month],
      set: {
        payload: encryptForUser(userId, { limit: Math.round(limit * 100) / 100 }),
        updatedAt: new Date(),
      },
    })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteMonthlyBudget(id: number) {
  const userId = await getUserId()
  if (!Number.isInteger(id) || id < 1) return
  await db
    .delete(budgets)
    .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
  revalidatePath('/dashboard')
}
