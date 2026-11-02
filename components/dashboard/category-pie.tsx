'use client'

import { Label, Pie, PieChart } from 'recharts'
import { motion } from 'motion/react'
import { PieChart as PieIcon } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatMoney } from '@/lib/finance'

type Category = { name: string; value: number; share: number; fill: string }

export function CategoryPie({
  categories,
  total,
}: {
  categories: Category[]
  total: number
}) {
  const config = Object.fromEntries(
    categories.map((c) => [c.name, { label: c.name, color: c.fill }]),
  ) satisfies ChartConfig

  return (
    <section className="h-full rounded-2xl border bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold">Where your money goes</h2>
        <p className="text-sm text-muted-foreground">Spending by category</p>
      </div>

      {categories.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <PieIcon className="size-8" aria-hidden="true" />
          <p className="text-sm">Add an expense to see your spending breakdown.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <ChartContainer config={config} className="aspect-square w-full max-w-[240px]">
            <PieChart>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value, name) => (
                      <span className="flex w-full justify-between gap-4">
                        <span>{name}</span>
                        <span className="font-mono tabular-nums">{formatMoney(Number(value))}</span>
                      </span>
                    )}
                  />
                }
              />
              <Pie
                data={categories}
                dataKey="value"
                nameKey="name"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                cornerRadius={6}
                stroke="none"
                animationDuration={900}
              >
                <Label
                  content={({ viewBox }) => {
                    if (!viewBox || !('cx' in viewBox)) return null
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) - 8} className="fill-muted-foreground text-xs">
                          Spent
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy ?? 0) + 14} className="fill-foreground font-mono text-lg font-semibold">
                          {formatMoney(total)}
                        </tspan>
                      </text>
                    )
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>

          <ul className="flex w-full flex-1 flex-col gap-3">
            {categories.map((c, i) => (
              <motion.li
                key={c.name}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i, duration: 0.45 }}
                className="flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ background: c.fill }} aria-hidden="true" />
                    {c.name}
                  </span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {Math.round(c.share * 100)}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: c.fill }}
                    initial={{ width: 0 }}
                    whileInView={{ width: `${c.share * 100}%` }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + 0.05 * i, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
