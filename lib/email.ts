function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.AUTH_EMAIL_FROM

  if (!apiKey || !from) {
    throw new Error('RESEND_API_KEY and AUTH_EMAIL_FROM must be configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Resend rejected the password reset email (HTTP ${response.status})`)
  }
}

export async function sendPasswordResetEmail(to: string, url: string) {
  const safeUrl = escapeHtml(url)
  await sendEmail({
    to,
    subject: 'Reset your Ledger password',
    text: `We received a request to reset your Ledger password. Use this link within 30 minutes: ${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your Ledger password.</p><p><a href="${safeUrl}">Reset your password</a></p><p>This link expires in 30 minutes. If you did not request this, you can ignore this email.</p>`,
  })
}

export async function sendPasswordChangedEmail(to: string) {
  await sendEmail({
    to,
    subject: 'Your Ledger password was changed',
    text: 'Your Ledger account password was just changed. If you did not make this change, reset your password immediately and contact support.',
    html: '<p>Your Ledger account password was just changed.</p><p>If you did not make this change, reset your password immediately and contact support.</p>',
  })
}
