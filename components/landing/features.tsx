'use client'

import { motion } from 'motion/react'
import { BarChart3, PieChart, Wallet } from 'lucide-react'

const features = [
  {
    icon: Wallet,
    title: 'Live balance',
    body: 'Every income and expense instantly updates your balance and savings rate.',
  },
  {
    icon: PieChart,
    title: 'Spending breakdown',
    body: 'A clear pie chart shows which categories take the biggest share of your money.',
  },
  {
    icon: BarChart3,
    title: 'Monthly cash flow',
    body: 'Compare money in versus money out over the last six months at a glance.',
  },
]

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-24 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="mb-12 max-w-xl"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-primary">Features</p>
        <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-4xl">
          Everything you need to understand your money.
        </h2>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.article
            key={f.title}
            initial={{ opacity: 0, y: 48, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -6 }}
            style={{ transformPerspective: 800 }}
            className="rounded-2xl border bg-card p-6"
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <f.icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-5 font-semibold">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  )
}
