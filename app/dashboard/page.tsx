import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getTransactions } from '@/app/actions/transactions'
import { monthlyCashflow, summarize } from '@/lib/finance'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { CategoryPie } from '@/components/dashboard/category-pie'
import { CashflowChart } from '@/components/dashboard/cashflow-chart'
import { TransactionForm } from '@/components/dashboard/transaction-form'
import { TransactionList } from '@/components/dashboard/transaction-list'
import { Reveal } from '@/components/reveal'

export const metadata = { title: 'Dashboard — Ledger' }

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  const transactions = await getTransactions()
  const summary = summarize(transactions)
  const cashflow = monthlyCashflow(transactions)

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
      </main>
    </div>
  )
}
