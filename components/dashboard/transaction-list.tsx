'use client'

import { AnimatePresence, motion } from 'motion/react'
import { useTransition } from 'react'
import { ArrowDownRight, ArrowUpRight, Receipt, Trash2 } from 'lucide-react'
import { deleteTransaction } from '@/app/actions/transactions'
import { formatMoney, type Transaction } from '@/lib/finance'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function Row({ t, index }: { t: Transaction; index: number }) {
  const [pending, startTransition] = useTransition()
  const isIncome = t.type === 'income'
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04 }}
      className={cn('flex items-center gap-3 py-3', pending && 'opacity-50')}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full',
          isIncome ? 'bg-income/15 text-income' : 'bg-expense/15 text-expense',
        )}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{t.note || t.category}</p>
        <p className="truncate text-xs text-muted-foreground">
          {t.category} · {formatDate(t.occurredAt)}
        </p>
      </div>
      <p
        className={cn(
          'font-mono text-sm font-semibold tabular-nums',
          isIncome ? 'text-income' : 'text-foreground',
        )}
      >
        {isIncome ? '+' : '−'}
        {formatMoney(t.amount)}
      </p>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${t.note || t.category}`}
        disabled={pending}
        onClick={() => startTransition(() => deleteTransaction(t.id))}
      >
        <Trash2 aria-hidden="true" />
      </Button>
    </motion.li>
  )
}

export function TransactionList({ transactions }: { transactions: Transaction[] }) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-semibold">Recent activity</h2>
        <span className="text-xs text-muted-foreground">{transactions.length} transactions</span>
      </div>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
          <Receipt className="size-8" aria-hidden="true" />
          <p className="text-sm">No transactions yet. Add your first one above.</p>
        </div>
      ) : (
        <ul className="divide-y">
          <AnimatePresence initial={false}>
            {transactions.map((t, i) => (
              <Row key={t.id} t={t} index={i} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  )
}
