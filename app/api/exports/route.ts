import { and, eq, gte, lt } from 'drizzle-orm'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { decryptForUser } from '@/lib/crypto'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { currentIndiaDate, type TransactionType } from '@/lib/finance'

export const dynamic = 'force-dynamic'

type ExportRow = {
  type: TransactionType
  amount: number
  category: string
  note: string
  occurredAt: string
}

function csvCell(value: string | number) {
  let text = String(value)
  if (/^[\t\r ]*[=+\-@]/.test(text)) text = `'${text}`
  return `"${text.replaceAll('"', '""')}"`
}

function csvLine(values: (string | number)[]) {
  return values.map(csvCell).join(',')
}

function respondCsv(content: string, filename: string) {
  return new Response(`\uFEFF${content}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 })
  }

  const url = new URL(request.url)
  const yearValue = url.searchParams.get('year') ?? ''
  const year = Number(yearValue)
  const format = url.searchParams.get('format') ?? 'transactions'
  const currentYear = Number(currentIndiaDate().slice(0, 4))
  if (!/^\d{4}$/.test(yearValue) || year < 2000 || year > currentYear + 1) {
    return Response.json({ error: 'Choose a valid export year.' }, { status: 400 })
  }
  if (format !== 'transactions' && format !== 'summary') {
    return Response.json({ error: 'Choose a valid export format.' }, { status: 400 })
  }

  const userId = session.user.id
  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        gte(transactions.occurredAt, `${year}-01-01`),
        lt(transactions.occurredAt, `${year + 1}-01-01`),
      ),
    )
    .orderBy(transactions.occurredAt, transactions.id)

  const data: ExportRow[] = []
  for (const row of rows) {
    try {
      const payload = decryptForUser<{
        amount: number
        category: string
        note: string
      }>(userId, row.payload)
      data.push({
        type: row.type as TransactionType,
        amount: payload.amount,
        category: payload.category,
        note: payload.note,
        occurredAt: row.occurredAt,
      })
    } catch (error) {
      console.error('Unable to decrypt a transaction for CSV export:', error)
      return Response.json(
        { error: 'Export stopped because a transaction could not be decrypted.' },
        { status: 500 },
      )
    }
  }

  if (format === 'transactions') {
    const lines = [
      csvLine(['Date', 'Type', 'Amount (INR)', 'Category', 'Description']),
      ...data.map((row) =>
        csvLine([row.occurredAt, row.type, row.amount.toFixed(2), row.category, row.note]),
      ),
    ]
    return respondCsv(lines.join('\r\n'), `ledger-transactions-${year}.csv`)
  }

  const monthly = new Map<string, { income: number; expense: number }>()
  const categories = new Map<string, number>()
  for (const row of data) {
    const month = row.occurredAt.slice(0, 7)
    const totals = monthly.get(month) ?? { income: 0, expense: 0 }
    totals[row.type] += row.amount
    monthly.set(month, totals)
    if (row.type === 'expense') {
      categories.set(row.category, (categories.get(row.category) ?? 0) + row.amount)
    }
  }

  const lines = [csvLine(['Section', 'Item', 'Amount (INR)'])]
  for (const [month, totals] of [...monthly.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(csvLine(['Monthly income', month, totals.income.toFixed(2)]))
    lines.push(csvLine(['Monthly expenses', month, totals.expense.toFixed(2)]))
    lines.push(csvLine(['Monthly balance', month, (totals.income - totals.expense).toFixed(2)]))
  }
  for (const [category, amount] of [...categories.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(csvLine(['Expense by category', category, amount.toFixed(2)]))
  }
  return respondCsv(lines.join('\r\n'), `ledger-annual-summary-${year}.csv`)
}
