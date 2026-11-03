'use client'

import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { deleteMonthlyBudget, saveMonthlyBudget, type BudgetActionState } from '@/app/actions/budgets'
import { EXPENSE_CATEGORIES, formatMoney } from '@/lib/finance'
import type { BudgetLimit } from '@/lib/budget-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function BudgetPanel({
  month,
  budgets,
  spentByCategory,
  enabled,
}: {
  month: string
  budgets: BudgetLimit[]
  spentByCategory: Record<string, number>
  enabled: boolean
}) {
  const [state, formAction, pending] = useActionState<BudgetActionState, FormData>(
    saveMonthlyBudget,
    {},
  )
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0])
  useEffect(() => {
    if (state.success) toast.success('Monthly budget saved')
    if (state.error) toast.error(state.error)
  }, [state])

  const configuredCategories = new Set(budgets.map((budget) => budget.category))

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Monthly budgets</h2>
        <p className="text-sm text-muted-foreground">
          Track spending against your category limits for {month}.
        </p>
      </div>

      {!enabled && (
        <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
          Budget storage is not ready yet. Apply the feature database migration, then refresh this page.
        </p>
      )}
      <form action={formAction} className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <input type="hidden" name="month" value={month} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget-category">Category</Label>
          <select
            id="budget-category"
            name="category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            disabled={!enabled}
          >
            {EXPENSE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}{configuredCategories.has(item) ? ' (update)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="budget-limit">Monthly limit (₹)</Label>
          <Input
            id="budget-limit"
            name="limit"
            type="number"
            inputMode="decimal"
            min="0.01"
            max="1000000000"
            step="0.01"
            required
            placeholder="5000"
            disabled={!enabled}
          />
        </div>
        <Button type="submit" disabled={pending || !enabled}>
          {pending ? 'Saving…' : 'Save budget'}
        </Button>
      </form>

      {state.error && <p role="alert" className="mb-3 text-sm text-destructive">{state.error}</p>}

      {budgets.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
          Set a category budget to see your monthly progress here.
        </p>
      ) : (
        <ul className="space-y-4">
          {budgets.map((budget) => {
            const spent = spentByCategory[budget.category] ?? 0
            const progress = Math.min((spent / budget.limit) * 100, 100)
            const overBudget = spent >= budget.limit
            return (
              <li key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">{budget.category}</span>
                  <span className={overBudget ? 'text-expense' : 'text-muted-foreground'}>
                    {formatMoney(spent)} / {formatMoney(budget.limit)}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={`${budget.category} budget`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progress)}
                  className="h-2 overflow-hidden rounded-full bg-muted"
                >
                  <div
                    className={`h-full rounded-full transition-[width] ${
                      overBudget ? 'bg-expense' : progress >= 80 ? 'bg-amber-400' : 'bg-primary'
                    }`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => deleteMonthlyBudget(budget.id)}
                  >
                    Remove
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
