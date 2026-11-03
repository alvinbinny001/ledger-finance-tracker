import { Suspense } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTransactionsForUser } from '@/lib/transaction-store'
import { currentIndiaDate, monthlyCashflow, summarize } from '@/lib/finance'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { CategoryPie } from '@/components/dashboard/category-pie'
import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { TransactionForm } from '@/components/dashboard/transaction-form'
import { TransactionList } from '@/components/dashboard/transaction-list'
import { Reveal } from '@/components/reveal'
import { BudgetPanelLoader } from '@/components/dashboard/budget-panel-loader'
import { CsvImportPanel } from '@/components/dashboard/csv-import-panel'
import { RecurringPanelLoader } from '@/components/dashboard/recurring-panel-loader'
import { ExportPanel } from '@/components/dashboard/export-panel'

export const metadata = { title: 'Dashboard — Ledger' }

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const userId = session.user.id
  const transactions = await getTransactionsForUser(userId)
  const summary = summarize(transactions)
  const cashflow = monthlyCashflow(transactions)
  const month = currentIndiaDate().slice(0, 7)

  return (
    <div className="min-h-svh">
      <DashboardHeader name={session.user.name} />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 pb-24 pt-6 md:px-6">
        <Reveal>
          <p className="text-sm text-muted-foreground">
            Hi {session.user.name.split(' ')[0]}, here&apos;s your money at a glance.
          </p>
        </Reveal>

        <SummaryCards
          balance={summary.balance}
          income={summary.income}
          expense={summary.expense}
        />

        <Reveal>
          <Suspense fallback={<div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">Loading monthly budgets…</div>}>
            <BudgetPanelLoader userId={userId} month={month} transactions={transactions} />
          </Suspense>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-5">
          <Reveal className="lg:col-span-3">
            <CategoryPie categories={summary.categories} total={summary.expense} />
          </Reveal>
          <Reveal className="lg:col-span-2" delay={0.1}>
            <TransactionForm />
          </Reveal>
        </div>

        <Reveal>
          <CashflowChart data={cashflow} />
        </Reveal>

        <Reveal>
          <TransactionList transactions={transactions} />
        </Reveal>

        <Reveal>
          <CsvImportPanel />
        </Reveal>

        <Reveal>
          <Suspense fallback={<div className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">Loading recurring transactions…</div>}>
            <RecurringPanelLoader userId={userId} />
          </Suspense>
        </Reveal>

        <Reveal>
          <ExportPanel />
        </Reveal>
      </main>
    </div>
  )
}
