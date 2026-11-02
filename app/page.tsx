import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { LandingNav } from '@/components/landing/landing-nav'
import { Hero } from '@/components/landing/hero'
import { Features } from '@/components/landing/features'
import { SecuritySection } from '@/components/landing/security-section'
import { FinalCta } from '@/components/landing/final-cta'

export default async function HomePage() {
  let session = null
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const requestHeaders = await headers()
    if (requestHeaders.get('cookie')?.includes('better-auth.session_token')) {
      session = await Promise.race([
        auth.api.getSession({ headers: requestHeaders }),
        new Promise<null>((resolve) => {
          timeout = setTimeout(() => {
            console.warn('Session retrieval timed out; continuing as guest.')
            resolve(null)
          }, 2000)
        }),
      ])
    }
  } catch (error) {
    console.error('Session retrieval error (continuing as guest):', error)
  } finally {
    if (timeout) clearTimeout(timeout)
  }
  if (session?.user) redirect('/dashboard')

  return (
    <>
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <SecuritySection />
        <FinalCta />
      </main>
      <footer className="border-t py-8 text-center text-xs text-muted-foreground">
        Ledger — your money, your eyes only.
      </footer>
    </>
  )
}
