'use client'

import Link from 'next/link'
import { useState, type FormEvent } from 'react'
import { Lock } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Logo } from '@/components/logo'

export function ResetPasswordForm({
  token,
  invalidToken,
}: {
  token: string | null
  invalidToken: boolean
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(
    invalidToken || !token ? 'This reset link is invalid or has expired. Request a new one.' : null,
  )
  const [complete, setComplete] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) return

    setPending(true)
    setError(null)
    const form = new FormData(event.currentTarget)
    const password = String(form.get('password'))
    const confirmPassword = String(form.get('confirmPassword'))

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      setPending(false)
      return
    }

    try {
      const { error: resetError } = await authClient.resetPassword({
        newPassword: password,
        token,
      })

      if (resetError) {
        setError('This reset link is invalid or has expired. Request a new one.')
        return
      }

      setComplete(true)
    } catch {
      setError('We could not reset your password. Please try again.')
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
            {complete ? 'Password updated' : 'Choose a new password'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {complete
              ? 'Your password has been changed. Other active sessions have been signed out.'
              : 'Use a new password with at least 8 characters.'}
          </p>
        </div>

        {complete ? (
          <Link
            href="/sign-in"
            className="flex h-10 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            Continue to sign in
          </Link>
        ) : (
          <>
            <form
              onSubmit={onSubmit}
              className="flex flex-col gap-4 rounded-2xl border bg-card p-6 shadow-2xl shadow-black/20"
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={!token || invalidToken}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={!token || invalidToken}
                />
              </div>

              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={pending || !token || invalidToken}
                className="mt-2"
              >
                {pending ? 'Updating…' : 'Update password'}
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="size-3" aria-hidden="true" />
                Other sessions will be signed out
              </p>
            </form>

            {(!token || invalidToken) && (
              <p className="mt-6 text-center text-sm">
                <Link
                  href="/forgot-password"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Request a new reset link
                </Link>
              </p>
            )}
          </>
        )}
      </div>
    </main>
  )
}
