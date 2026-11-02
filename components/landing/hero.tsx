'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight, Lock } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { formatMoney } from '@/lib/finance'

const slices = [
  { label: 'Housing', pct: 38, color: 'var(--chart-1)' },
  { label: 'Food & Dining', pct: 22, color: 'var(--chart-2)' },
  { label: 'Transport', pct: 16, color: 'var(--chart-3)' },
  { label: 'Shopping', pct: 14, color: 'var(--chart-4)' },
  { label: 'Other', pct: 10, color: 'var(--chart-5)' },
]

function DonutPreview() {
  const radius = 70
  const circumference = 2 * Math.PI * radius
  let offset = 0
  return (
    <svg viewBox="0 0 180 180" className="size-full -rotate-90" aria-hidden="true">
      <circle cx="90" cy="90" r={radius} fill="none" stroke="var(--muted)" strokeWidth="22" />
      {slices.map((s, i) => {
        const length = (s.pct / 100) * circumference
        const dash = `${Math.max(length - 4, 0)} ${circumference}`
        const el = (
          <motion.circle
            key={s.label}
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="22"
            strokeLinecap="round"
            strokeDashoffset={-offset}
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: dash }}
            transition={{ duration: 1, delay: 0.4 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
          />
        )
        offset += length
        return el
      })}
    </svg>
  )
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 160])
  const cardRotate = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -6])
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -80])
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 size-[600px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-primary/20 blur-[120px]"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-24 pt-16 md:grid-cols-2 md:px-6 md:pt-24">
        <motion.div style={{ y: textY, opacity: fade }} className="flex flex-col gap-6">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex w-fit items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground"
          >
            <Lock className="size-3 text-primary" aria-hidden="true" />
            End-to-server AES-256 encryption
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-4xl font-semibold leading-tight tracking-tight md:text-6xl"
          >
            Know exactly <span className="text-primary">where your money goes.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-md text-pretty text-lg text-muted-foreground"
          >
            Log your income and spending, watch your balance in real time, and see
            which categories eat the biggest slice — all kept private and encrypted.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap gap-3"
          >
            <Link href="/sign-up" className={buttonVariants({ size: 'lg' })}>
              Start tracking free
              <ArrowRight aria-hidden="true" />
            </Link>
            <a href="#features" className={buttonVariants({ size: 'lg', variant: 'outline' })}>
              See how it works
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          style={{ y: cardY, rotate: cardRotate }}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl border bg-card/80 p-6 shadow-2xl shadow-black/40 backdrop-blur"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Balance</p>
              <p className="font-mono text-3xl font-semibold tabular-nums">
                {formatMoney(8420.55)}
              </p>
            </div>
            <span className="rounded-full bg-income/15 px-2.5 py-1 font-mono text-xs text-income">
              +12.4%
            </span>
          </div>
          <div className="mt-6 flex items-center gap-6">
            <div className="size-36 shrink-0">
              <DonutPreview />
            </div>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {slices.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate">
                    <span className="size-2 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-mono text-muted-foreground">{s.pct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
