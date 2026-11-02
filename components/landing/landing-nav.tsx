'use client'

import Link from 'next/link'
import { motion, useScroll, useSpring } from 'motion/react'
import { buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export function LandingNav() {
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  return (
    <header className="sticky top-0 z-40 border-b bg-background/70 backdrop-blur-xl">
      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-primary"
        style={{ scaleX: progress }}
      />
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" aria-label="Ledger home">
          <Logo />
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/sign-in" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            Sign in
          </Link>
          <Link href="/sign-up" className={buttonVariants({ size: 'sm' })}>
            Get started
          </Link>
        </nav>
      </div>
    </header>
  )
}
