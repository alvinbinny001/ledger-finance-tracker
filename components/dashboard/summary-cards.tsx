'use client'

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react'
import { formatMoney } from '@/lib/finance'
import { cn } from '@/lib/utils'

function AnimatedMoney({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const reduce = useReducedMotion()
  const mv = useMotionValue(reduce ? value : 0)
  const text = useTransform(mv, (v) => formatMoney(v))

  useEffect(() => {
    if (!inView) return
    if (reduce) {
      mv.set(value)
      return
    }
    const controls = animate(mv, value, { duration: 1.2, ease: [0.22, 1, 0.36, 1] })
    return () => controls.stop()
  }, [inView, value, mv, reduce])

  return <motion.span ref={ref}>{text}</motion.span>
}

export function SummaryCards({
  balance,
  income,
  expense,
}: {
  balance: number
  income: number
  expense: number
}) {
  const savingsRate = income > 0 ? Math.max(0, (income - expense) / income) : 0
  const cards = [
    {
      label: 'Current balance',
      value: balance,
      icon: Wallet,
      hint: `${Math.round(savingsRate * 100)}% of income kept`,
      accent: 'text-primary',
      featured: true,
    },
    {
      label: 'Total income',
      value: income,
      icon: ArrowUpRight,
      hint: 'All money in',
      accent: 'text-income',
    },
    {
      label: 'Total spent',
      value: expense,
      icon: ArrowDownRight,
      hint: 'All money out',
      accent: 'text-expense',
    },
  ]

  return (
    <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
      {cards.map((card, i) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            'relative overflow-hidden rounded-2xl border bg-card p-5',
            card.featured && 'border-primary/30 bg-gradient-to-br from-primary/15 via-card to-card',
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <card.icon className={cn('size-4', card.accent)} aria-hidden="true" />
          </div>
          <p
            className={cn(
              'mt-3 font-mono text-3xl font-semibold tracking-tight tabular-nums',
              card.featured && card.value < 0 && 'text-expense',
            )}
          >
            <AnimatedMoney value={card.value} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
        </motion.div>
      ))}
    </section>
  )
}
