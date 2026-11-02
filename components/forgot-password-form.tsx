'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage(null)
    setError(null)

    const form = new FormData(event.currentTarget)
    const email = String(form.get('email'))

    try {
      const { error: requestError } = await authClient.requestPasswordReset({
        email,
        redirectTo: '/reset-password',
      })

      if (requestError) {
        setError('We could not process that request. Please try again later.')
        return
      }

      setMessage(
        'If an account exists for that email, a password reset link will arrive shortly. Check your inbox and spam folder.',
      )
    } catch {
      setError('We could not process that request. Please try again later.')
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
            Forgot your password?
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your account email and we&apos;ll send a secure reset link.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-2xl shadow-black/20"
        >
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

          {message && (
            <p role="status" className="text-sm text-muted-foreground">
              {message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" disabled={pending} className="mt-2">
            {pending ? 'Sending…' : 'Send reset link'}
          </Button>

          <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden="true" />
            Reset links expire after 30 minutes
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  )
}
