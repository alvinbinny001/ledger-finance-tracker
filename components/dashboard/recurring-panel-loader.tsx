import { getRecurringRulesForUser } from '@/lib/recurring-store'
import { RecurringPanel } from '@/components/dashboard/recurring-panel'

function isMissingTable(error: unknown) {
  let current: unknown = error
  for (let depth = 0; depth < 5 && current instanceof Error; depth += 1) {
    if ('code' in current && current.code === '42P01') return true
    current = current.cause
  }
  return false
}

export async function RecurringPanelLoader({ userId }: { userId: string }) {
  try {
    const rules = await getRecurringRulesForUser(userId)
    return (
      <RecurringPanel
        rules={rules}
        schemaReady
        schedulerEnabled={Boolean(process.env.CRON_SECRET)}
      />
    )
  } catch (error) {
    if (!isMissingTable(error)) throw error
    console.error('Ledger recurring migration is required before recurring rules can be used.')
    return <RecurringPanel rules={[]} schemaReady={false} schedulerEnabled={false} />
  }
}
