import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { ChangePasswordForm } from '@/components/change-password-form'

export const metadata = { title: 'Change password — Ledger' }

export default async function ChangePasswordPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <div className="min-h-svh">
      <DashboardHeader name={session.user.name} />
      <main className="mx-auto flex max-w-6xl justify-center px-4 py-10 md:px-6">
        <ChangePasswordForm />
      </main>
    </div>
  )
}
