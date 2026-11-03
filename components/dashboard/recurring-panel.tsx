'use client'

import { useActionState, useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { toast } from 'sonner'
import { createRecurringRule, deleteRecurringRule, type RecurringActionState } from '@/app/actions/recurring'
import type { RecurringRule } from '@/lib/recurring-store'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, formatMoney, type TransactionType } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function dateLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function RecurringPanel({
  rules,
  schedulerEnabled,
  schemaReady,
}: {
  rules: RecurringRule[]
  schedulerEnabled: boolean
  schemaReady: boolean
}) {
  const [type, setType] = useState<TransactionType>('expense')
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const [category, setCategory] = useState<string>(categories[0])
  const [state, formAction, pending] = useActionState<RecurringActionState, FormData>(
    createRecurringRule,
    {},
  )

  useEffect(() => {
    if (state.success) toast.success('Monthly transaction scheduled')
    if (state.error) toast.error(state.error)
  }, [state])

  function changeType(value: TransactionType) {
    setType(value)
    setCategory((value === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0])
  }

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Recurring transactions</h2>
        <p className="text-sm text-muted-foreground">
          Automatically add a transaction each month on your chosen day.
        </p>
      </div>

      {!schemaReady ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Recurring storage is not ready yet. Apply the feature database migration, then refresh this page.
        </p>
      ) : !schedulerEnabled ? (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Scheduled entries are not enabled yet. Add a <code>CRON_SECRET</code> environment variable in Vercel and redeploy to turn on monthly automation.
        </p>
      ) : null}
      <form action={formAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <input type="hidden" name="type" value={type} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-type">Type</Label>
          <select
            id="recurring-type"
            value={type}
            onChange={(event) => changeType(event.target.value as TransactionType)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            disabled={!schedulerEnabled}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-amount">Amount (₹)</Label>
          <Input id="recurring-amount" name="amount" type="number" inputMode="decimal" min="0.01" step="0.01" required disabled={!schedulerEnabled} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-category">Category</Label>
          <select
            id="recurring-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            disabled={!schedulerEnabled}
          >
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="recurring-day">Day of month</Label>
          <Input id="recurring-day" name="dayOfMonth" type="number" min="1" max="31" defaultValue="1" required disabled={!schedulerEnabled} />
        </div>
        <Button type="submit" disabled={pending || !schedulerEnabled}>
          <CalendarClock aria-hidden="true" />
          {pending ? 'Saving…' : 'Schedule'}
        </Button>
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-5">
          <Label htmlFor="recurring-note">Description (optional)</Label>
          <Input id="recurring-note" name="note" maxLength={140} placeholder="Rent, salary, subscription…" disabled={!schedulerEnabled} />
        </div>
      </form>

      {state.error && <p role="alert" className="mt-3 text-sm text-destructive">{state.error}</p>}

      {rules.length > 0 ? (
        <ul className="mt-5 divide-y">
          {rules.map((rule) => (
            <li key={rule.id} className="flex flex-wrap items-center gap-3 py-3">
              <CalendarClock className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{rule.note || rule.category}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.category} · {rule.type} · next on {dateLabel(rule.nextRunDate)}
                </p>
              </div>
              <span className="font-mono text-sm">{formatMoney(rule.amount)}</span>
              <Button type="button" size="xs" variant="ghost" onClick={() => deleteRecurringRule(rule.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">No monthly transactions scheduled yet.</p>
      )}
    </section>
  )
}
