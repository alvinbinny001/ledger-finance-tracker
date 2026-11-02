'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { KeyRound, Lock, ShieldCheck, UserCheck } from 'lucide-react'

const points = [
  {
    icon: Lock,
    title: 'AES-256-GCM encryption',
    body: 'Amounts, categories and notes are encrypted on the server before being stored.',
  },
  {
    icon: KeyRound,
    title: 'A unique key per user',
    body: 'Keys are derived per account with HKDF, so your data is unreadable to anyone else.',
  },
  {
    icon: UserCheck,
    title: 'Secure sessions',
    body: 'Passwords are hashed and sessions use HTTP-only cookies. Every query is scoped to you.',
  },
]

const SAMPLE = 'v1.Xk9qL2mPz0aR.bT7wq3.Ui8nHd2rQvZyFp4cKs1eW0xMg6aLjN5'

export function SecuritySection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const chars = useTransform(scrollYProgress, [0.2, 1], [0, SAMPLE.length])
  const revealed = useTransform(chars, (n) => SAMPLE.slice(0, Math.round(n)))
  const plainOpacity = useTransform(scrollYProgress, [0.2, 0.7], [1, 0.25])

  return (
    <section ref={ref} className="border-y bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-24 md:grid-cols-2 md:px-6">
        <div className="flex flex-col gap-4">
          <p className="font-mono text-xs uppercase tracking-widest text-primary">Security</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
            Your finances stay yours.
          </h2>
          <p className="text-pretty text-muted-foreground">
            Even if someone got into the database, they would only see scrambled ciphertext.
          </p>

          <div className="mt-4 flex flex-col gap-3 rounded-2xl border bg-background p-5 font-mono text-sm">
            <motion.div style={{ opacity: plainOpacity }} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">plaintext</span>
              <span>{'{ amount: 42.50, "Food & Dining" }'}</span>
            </motion.div>
            <div className="h-px bg-border" />
            <div className="flex items-start justify-between gap-3">
              <span className="flex shrink-0 items-center gap-1.5 text-primary">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                stored
              </span>
              <motion.span className="break-all text-right text-primary/90">{revealed}</motion.span>
            </div>
          </div>
        </div>

        <ul className="flex flex-col gap-4">
          {points.map((p, i) => (
            <motion.li
              key={p.title}
              initial={{ opacity: 0, x: 48 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="flex gap-4 rounded-2xl border bg-card p-5"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <p.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}
