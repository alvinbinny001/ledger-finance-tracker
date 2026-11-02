import { AuthForm } from '@/components/auth-form'

export const metadata = { title: 'Create account — Ledger' }

export default function SignUpPage() {
  return <AuthForm mode="sign-up" />
}
