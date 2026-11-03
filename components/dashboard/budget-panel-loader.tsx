import { getBudgetsForUser } from '@/lib/budget-store'
import type { Transaction } from '@/lib/finance'
import { BudgetPanel } from '@/components/dashboard/budget-panel'

function isMissingTable(error: unknown) {
  let current: unknown = error
  for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
    if ('code' in current && current.code === '42P01') return true
    current = current.cause
  }
  return false
}

export async function BudgetPanelLoader({
  userId,
  month,
  transactions,
}: {
  userId: string
  month: string
  transactions: Transaction[]
}) {
  const spentByCategory: Record<string, number> = {}
  for (const transaction of transactions) {
    if (transaction.type === 'expense' && transaction.occurredAt.startsWith(month)) {
      spentByCategory[transaction.category] =
        (spentByCategory[transaction.category] ?? 0) + transaction.amount
    }
  }

  try {
    const budgets = await getBudgetsForUser(userId, month)
    return (
      <BudgetPanel
        month={month}
        budgets={budgets}
        spentByCategory={spentByCategory}
        enabled
      />
    )
  } catch (error) {
    if (!isMissingTable(error)) throw error
    console.error('Ledger budget migration is required before budgets can be used.')
    return (
      <BudgetPanel
        month={month}
        budgets={[]}
        spentByCategory={spentByCategory}
        enabled={false}
      />
    )
  }
}
