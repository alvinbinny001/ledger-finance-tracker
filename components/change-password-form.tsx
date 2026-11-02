'use client'

import { useState, type FormEvent } from 'react'
import { KeyRound } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ChangePasswordForm() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [complete, setComplete] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setPending(true)
    setError(null)
    const form = new FormData(formElement)
    const currentPassword = String(form.get('currentPassword'))
    const newPassword = String(form.get('newPassword'))
    const confirmPassword = String(form.get('confirmPassword'))

    if (newPassword !== confirmPassword) {
      setError('The new passwords do not match.')
      setPending(false)
      return
    }
    if (currentPassword === newPassword) {
      setError('Choose a new password that is different from your current one.')
      setPending(false)
      return
    }

    try {
      const { error: changeError } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      })

      if (changeError) {
        setError(
          changeError.code === 'INVALID_PASSWORD'
            ? 'Your current password is incorrect.'
            : 'We could not change your password. Please try again.',
        )
        return
      }

      formElement.reset()
      setComplete(true)
    } catch {
      setError('We could not change your password. Please try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="w-full max-w-lg rounded-2xl border bg-card p-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Change password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Confirm your current password. Other signed-in sessions will be revoked.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="currentPassword">Current password</Label>
          <Input
            id="currentPassword"
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
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
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {complete && (
          <p role="status" className="text-sm text-income">
            Password updated successfully.
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          <KeyRound aria-hidden="true" />
          {pending ? 'Updating…' : 'Update password'}
        </Button>
      </form>
    </section>
  )
}
