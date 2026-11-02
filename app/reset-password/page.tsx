import { ResetPasswordForm } from '@/components/reset-password-form'

export const metadata = { title: 'Reset password — Ledger' }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; error?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : null
  const invalidToken = params.error === 'INVALID_TOKEN'

  return <ResetPasswordForm token={token} invalidToken={invalidToken} />
}
