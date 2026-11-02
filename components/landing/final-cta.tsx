'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 md:px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-card to-card p-10 text-center md:p-16"
      >
        <h2 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Take control of your money today.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
          Create a free account in seconds. No bank connections, no data selling.
        </p>
        <Link href="/sign-up" className={buttonVariants({ size: 'lg', className: 'mt-8' })}>
          Create your ledger
          <ArrowRight aria-hidden="true" />
        </Link>
      </motion.div>
    </section>
  )
}
