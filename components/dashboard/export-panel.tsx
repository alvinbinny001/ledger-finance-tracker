'use client'

import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { currentIndiaDate } from '@/lib/finance'

export function ExportPanel() {
  const currentYear = Number(currentIndiaDate().slice(0, 4))
  const [year, setYear] = useState(String(currentYear))
  const years = Array.from({ length: 11 }, (_, index) => String(currentYear - index))

  function download(format: 'transactions' | 'summary') {
    window.location.assign(`/api/exports?year=${year}&format=${format}`)
  }

  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Export your records</h2>
        <p className="text-sm text-muted-foreground">
          Download a private CSV of your transactions or annual spending summary.
        </p>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-muted-foreground">Year</span>
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className="h-9 min-w-28 rounded-lg border border-input bg-background px-3"
          >
            {years.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <Button type="button" variant="outline" onClick={() => download('transactions')}>
          <Download aria-hidden="true" />
          Transactions
        </Button>
        <Button type="button" variant="outline" onClick={() => download('summary')}>
          <Download aria-hidden="true" />
          Annual summary
        </Button>
      </div>
    </section>
  )
}
