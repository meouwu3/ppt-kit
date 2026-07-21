import { motion } from 'motion/react'
import { EASE, useClickAt } from '../deck/ClickScope'
import { FlowNumber } from './metrics'

export type BarDatum = {
  label: string
  value: number
  tone?: 'ink' | 'accent' | 'good' | 'warning'
  highlight?: boolean
  precision?: number
  prefix?: string
  suffix?: string
}

const toneClass = {
  ink: 'bg-ink-muted',
  accent: 'bg-accent',
  good: 'bg-good',
  warning: 'bg-warning',
}

export function MetricBarChart({
  data,
  at,
  height = 270,
}: {
  data: BarDatum[]
  at?: number
  height?: number
}) {
  const { active, print } = useClickAt(at)
  const max = Math.max(...data.map((datum) => datum.value), 1)
  const maximumBarHeight = Math.max(height - 100, 24)
  return (
    <figure className="relative flex w-full items-stretch gap-[var(--space-block)] px-5" style={{ height }}>
      <div aria-hidden="true" className="absolute right-5 bottom-[52px] left-5 h-px bg-line-strong" />
      {data.map((datum, index) => {
        const barHeight = (datum.value / max) * maximumBarHeight
        const tone = datum.tone ?? (datum.highlight ? 'accent' : 'ink')
        const precision = datum.precision ?? Math.min(String(datum.value).split('.')[1]?.length ?? 0, 3)
        return (
          <div key={datum.label} className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end">
            <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center justify-end">
              <motion.div
                className={`mb-[var(--space-chart-label)] text-sm font-medium whitespace-nowrap ${datum.highlight ? 'text-accent-strong' : 'text-ink-muted'}`}
                initial={false}
                animate={{ opacity: print || active ? 1 : 0 }}
                transition={{ delay: print ? 0 : 0.25 + index * 0.07 }}
              >
                {datum.prefix}<FlowNumber value={datum.value} precision={precision} active={active} print={print} />{datum.suffix}
              </motion.div>
              <motion.div
                className={`w-full max-w-20 origin-bottom ${toneClass[tone]}`}
                initial={false}
                animate={{ height: print || active ? barHeight : 0, opacity: print || active ? 0.92 : 0 }}
                transition={{ duration: print ? 0 : 0.72, delay: print ? 0 : index * 0.07, ease: EASE }}
              />
            </div>
            <div className="mt-3 h-10 text-center text-sm leading-tight text-ink-faint">{datum.label}</div>
          </div>
        )
      })}
    </figure>
  )
}
