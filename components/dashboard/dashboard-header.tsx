'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button, buttonVariants } from '@/components/ui/button'
import { Logo } from '@/components/logo'

export function DashboardHeader({ name }: { name: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function onSignOut() {
    setPending(true)
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" aria-label="Dashboard">
          <Logo />
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
          <Link
            href="/change-password"
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
          >
            <KeyRound aria-hidden="true" />
            Password
          </Link>
          <Button variant="outline" size="sm" onClick={onSignOut} disabled={pending}>
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
