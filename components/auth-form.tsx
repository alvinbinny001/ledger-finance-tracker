'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isSignUp = mode === 'sign-up'

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)
    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))
    const password = String(form.get('password'))

    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({
            email,
            password,
            name: String(form.get('name') || email.split('@')[0]),
          })
        : await authClient.signIn.email({ email, password })

      if (error) {
        setError(
          isSignUp
            ? 'Could not create your account. Try a different email or a longer password.'
            : 'Invalid email or password.',
        )
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError(
        'Could not connect to the authentication service. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link href="/" aria-label="Ledger home">
            <Logo />
          </Link>
          <h1 className="text-balance text-2xl font-semibold tracking-tight">
            {isSignUp ? 'Create your private ledger' : 'Welcome back'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? 'Your transactions are encrypted before they touch the database.'
              : 'Sign in to see where your money is going.'}
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-2xl shadow-black/20"
        >
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" autoComplete="name" placeholder="Alex" />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? 'Please wait…' : isSignUp ? 'Create account' : 'Sign in'}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            AES-256-GCM encrypted at rest
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? 'Already have an account? ' : 'New here? '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Create an account'}
          </Link>
        </p>
        {!isSignUp && (
          <p className="mt-3 text-center text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </p>
        )}
      </div>
    </main>
  )
}
