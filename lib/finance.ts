export type TransactionType = 'income' | 'expense'

export type Transaction = {
  id: number
  type: TransactionType
  amount: number
  category: string
  note: string
  occurredAt: string
}

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food & Dining',
  'Transport',
  'Shopping',
  'Bills & Utilities',
  'Entertainment',
  'Health',
  'Travel',
  'Education',
  'Other',
] as const

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income',
] as const

export const CATEGORY_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
]

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

export function formatMoney(value: number) {
  return currency.format(value)
}

export function currentIndiaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: 'year' | 'month' | 'day') =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}`
}

export function summarize(transactions: Transaction[]) {
  let income = 0
  let expense = 0
  const byCategory = new Map<string, number>()

  for (const t of transactions) {
    if (t.type === 'income') {
      income += t.amount
    } else {
      expense += t.amount
      byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + t.amount)
    }
  }

  const categories = [...byCategory.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .map((c, i) => ({
      ...c,
      share: expense > 0 ? c.value / expense : 0,
      fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
    }))

  return { income, expense, balance: income - expense, categories }
}

export function monthlyCashflow(transactions: Transaction[], months = 6) {
  const now = new Date()
  const buckets = Array.from({ length: months }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: d.toLocaleString('en-US', { month: 'short' }),
      income: 0,
      expense: 0,
    }
  })
  const index = new Map(buckets.map((b, i) => [b.key, i]))

  for (const t of transactions) {
    const i = index.get(t.occurredAt.slice(0, 7))
    if (i === undefined) continue
    buckets[i][t.type] += t.amount
  }
  return buckets
}
