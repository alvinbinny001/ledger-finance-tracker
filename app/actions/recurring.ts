'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { encryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { recurringTransactions } from '@/lib/db/schema'
import {
  currentIndiaDate,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  type TransactionType,
} from '@/lib/finance'
import type { RecurringRule } from '@/lib/recurring-store'
import { getRecurringRulesForUser } from '@/lib/recurring-store'

export type RecurringActionState = { error?: string; success?: boolean }

async function getUserId() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

export async function getRecurringRules(): Promise<RecurringRule[]> {
  return getRecurringRulesForUser(await getUserId())
}

function firstDueDate(dayOfMonth: number) {
  const todayIso = currentIndiaDate()
  const [year, monthNumber, currentDay] = todayIso.split('-').map(Number)
  const month = monthNumber - 1
  const dayInCurrentMonth = Math.min(
    dayOfMonth,
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate(),
  )
  let yearToUse = year
  let monthToUse = month
  let dayToUse = dayInCurrentMonth

  if (dayInCurrentMonth < currentDay) {
    monthToUse += 1
    if (monthToUse > 11) {
      monthToUse = 0
      yearToUse += 1
    }
    dayToUse = Math.min(
      dayOfMonth,
      new Date(Date.UTC(yearToUse, monthToUse + 1, 0)).getUTCDate(),
    )
  }

  return `${yearToUse}-${String(monthToUse + 1).padStart(2, '0')}-${String(dayToUse).padStart(2, '0')}`
}

export async function createRecurringRule(
  _previous: RecurringActionState,
  formData: FormData,
): Promise<RecurringActionState> {
  if (!process.env.CRON_SECRET) {
    return { error: 'Monthly scheduling is not enabled. Configure CRON_SECRET in Vercel first.' }
  }
  const userId = await getUserId()
  const type = formData.get('type')
  const category = String(formData.get('category') ?? '')
  const note = String(formData.get('note') ?? '').trim().slice(0, 140)
  const amount = Number(formData.get('amount'))
  const dayOfMonth = Number(formData.get('dayOfMonth'))

  if (type !== 'income' && type !== 'expense') {
    return { error: 'Choose income or expense.' }
  }
  const allowed: readonly string[] =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  if (!allowed.includes(category)) return { error: 'Choose a valid category.' }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    return { error: 'Enter an amount greater than ₹0.' }
  }
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
    return { error: 'Choose a day from 1 to 31.' }
  }

  await db.insert(recurringTransactions).values({
    userId,
    type: type as TransactionType,
    category,
    payload: encryptForUser(userId, {
      amount: Math.round(amount * 100) / 100,
      note,
    }),
    dayOfMonth,
    nextRunDate: firstDueDate(dayOfMonth),
  })

  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteRecurringRule(id: number) {
  const userId = await getUserId()
  if (!Number.isInteger(id) || id < 1) return
  await db
    .delete(recurringTransactions)
    .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
  revalidatePath('/dashboard')
}
