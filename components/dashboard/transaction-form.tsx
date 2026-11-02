'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { Lock, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addTransaction, type ActionState } from '@/app/actions/transactions'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

function today() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TransactionForm() {
  const [type, setType] = useState<TransactionType>('expense')
  const categories: readonly string[] =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const [category, setCategory] = useState<string>(categories[0])
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    addTransaction,
    {},
  )

  useEffect(() => {
    if (state.success) {
      toast.success('Transaction saved and encrypted')
      formRef.current?.reset()
    }
  }, [state])

  function switchType(next: TransactionType) {
    setType(next)
    setCategory((next === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0])
  }

  return (
    <section className="h-full rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Add transaction</h2>
        <p className="text-sm text-muted-foreground">Log money in or out</p>
      </div>

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="type" value={type} />
        <div role="radiogroup" aria-label="Transaction type" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
          {(['expense', 'income'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={type === t}
              onClick={() => switchType(t)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors',
                type === t
                  ? t === 'income'
                    ? 'bg-income text-background'
                    : 'bg-expense text-background'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="occurredAt">Date</Label>
            <Input id="occurredAt" name="occurredAt" type="date" required defaultValue={today()} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="category">Category</Label>
          <Select
            name="category"
            value={category}
            onValueChange={(v) => v && setCategory(String(v))}
          >
            <SelectTrigger id="category" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Input id="note" name="note" maxLength={140} placeholder="Groceries at the market" />
        </div>

        {state.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          <Plus aria-hidden="true" />
          {pending ? 'Encrypting…' : 'Add transaction'}
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="size-3" aria-hidden="true" />
          Amount, category and note are encrypted
        </p>
      </form>
    </section>
  )
}
