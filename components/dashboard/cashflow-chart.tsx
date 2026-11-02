'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

const config = {
  income: { label: 'Income', color: 'var(--income)' },
  expense: { label: 'Expenses', color: 'var(--expense)' },
} satisfies ChartConfig

export function CashflowChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[]
}) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Cash flow</h2>
        <p className="text-sm text-muted-foreground">Income vs. expenses, last 6 months</p>
      </div>
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="income" fill="var(--color-income)" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="var(--color-expense)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ChartContainer>
    </section>
  )
}
