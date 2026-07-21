import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import NumberFlow from '@number-flow/react'
import { motion } from 'motion/react'
import rough from 'roughjs'
import { EASE, useClickAt } from '../deck/ClickScope'
import type { ReactNode } from 'react'

const FLOW_TIMING = {
  transformTiming: { duration: 700, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  spinTiming: { duration: 900, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' },
}

const TONE = {
  accent: 'text-accent',
  good: 'text-good',
  ink: 'text-ink',
} as const

export function FlowNumber({
  value,
  precision = 0,
  active = true,
  print = false,
  className = '',
}: {
  value: number
  precision?: number
  active?: boolean
  print?: boolean
  className?: string
}) {
  const format = { minimumFractionDigits: precision, maximumFractionDigits: precision }
  if (print)
    return <span className={`tnum ${className}`}>{value.toLocaleString('en-US', format)}</span>
  return (
    <NumberFlow
      value={active ? value : 0}
      format={format}
      locales="en-US"
      {...FLOW_TIMING}
      className={`tnum transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}

export function BigNumber({
  value,
  unit,
  label,
  prefix,
  precision = 0,
  tone = 'accent',
  at,
  size = 'lg',
}: {
  value: number
  unit?: string
  label?: ReactNode
  prefix?: string
  precision?: number
  tone?: keyof typeof TONE
  at?: number
  size?: 'lg' | 'md'
}) {
  const { active, print } = useClickAt(at)
  const numeral = size === 'lg' ? 'text-[7rem]' : 'text-[4.5rem]'
  const unitSize = size === 'lg' ? 'text-4xl' : 'text-2xl'

  return (
    <div className={`transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`tnum flex items-baseline font-display font-semibold ${TONE[tone]}`}>
        {prefix && <span className={`${unitSize} mr-1`}>{prefix}</span>}
        <FlowNumber value={value} precision={precision} active={active} print={print} className={`${numeral} leading-none`} />
        {unit && <span className={`ml-2 ${unitSize} font-medium`}>{unit}</span>}
      </div>
      {label && <div className="mt-4 text-xl leading-snug text-ink-muted">{label}</div>}
    </div>
  )
}

export function Num({
  value,
  precision = 0,
  at,
  className = '',
}: {
  value: number
  precision?: number
  at?: number
  className?: string
}) {
  const { active, print } = useClickAt(at)
  return <FlowNumber value={value} precision={precision} active={active} print={print} className={className} />
}

export function Compare({
  label,
  before,
  after,
  unit = '',
  beforeLabel = '之前',
  afterLabel = '之后',
  precision = 0,
  at,
}: {
  label?: ReactNode
  before: number
  after: number
  unit?: string
  beforeLabel?: string
  afterLabel?: string
  precision?: number
  at?: number
}) {
  const { active, print } = useClickAt(at)
  const max = Math.max(before, after, 1)
  const row = (tag: string, value: number, className: string, delay: number) => {
    const width = `${(value / max) * 100}%`
    return (
      <div className="flex items-center gap-6">
        <div className="w-16 shrink-0 text-lg text-ink-faint">{tag}</div>
        <div className="h-10 min-w-0 flex-1">
          {print ? (
            <div className={`h-full ${className}`} style={{ width }} />
          ) : (
            <motion.div
              className={`h-full origin-left ${className}`}
              initial={false}
              animate={{ width: active ? width : 0 }}
              transition={{ duration: 0.9, ease: EASE, delay }}
            />
          )}
        </div>
        <div className="tnum w-44 shrink-0 text-right text-3xl font-medium text-ink">
          <FlowNumber value={value} precision={precision} active={active} print={print} />
          <span className="ml-1 text-xl text-ink-muted">{unit}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`transition-opacity duration-200 ${active ? 'opacity-100' : 'opacity-0'}`}>
      {label && <div className="mb-5 text-xl text-ink-muted">{label}</div>}
      <div className="space-y-4">
        {row(beforeLabel, before, 'bg-line-strong', 0)}
        {row(afterLabel, after, 'bg-accent', 0.2)}
      </div>
    </div>
  )
}

export function ArchBox({
  title,
  sub,
  tone = 'plain',
  hand = false,
  seed,
  className = '',
}: {
  title: ReactNode
  sub?: ReactNode
  tone?: 'plain' | 'accent'
  hand?: boolean
  seed?: number
  className?: string
}) {
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  useLayoutEffect(() => {
    if (!hand || !ref.current) return
    const element = ref.current
    const observer = new ResizeObserver(() =>
      setSize({ width: element.offsetWidth, height: element.offsetHeight }),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [hand])

  const paths = useMemo(() => {
    if (!hand || !size) return null
    const autoSeed =
      ([...id].reduce((value, character) => (value * 33 + character.charCodeAt(0)) >>> 0, 7) %
        2 ** 31) +
      1
    const generator = rough.generator()
    const drawable = generator.rectangle(2, 2, size.width - 4, size.height - 4, {
      seed: seed ?? autoSeed,
      roughness: 1.5,
      bowing: 1.3,
      strokeWidth: 1.5,
      ...(tone === 'accent'
        ? { fill: 'x', fillStyle: 'hachure', hachureGap: 7, fillWeight: 0.8 }
        : {}),
    })
    return drawable.sets.map((set) => ({ type: set.type, d: generator.opsToPath(set) }))
  }, [hand, id, seed, size, tone])

  if (!hand)
    return (
      <div
        className={`rounded-[var(--radius-md)] border px-[var(--space-card-padding-x)] py-[var(--space-card-padding-y)] text-center ${
          tone === 'accent'
            ? 'border-accent/50 bg-accent-soft/45 text-accent-strong'
            : 'border-line bg-paper-raised text-ink'
        } ${className}`}
      >
        <div className="text-xl font-medium">{title}</div>
        {sub && <div className="mt-1 text-sm text-ink-muted">{sub}</div>}
      </div>
    )

  const stroke = tone === 'accent' ? 'var(--accent)' : 'var(--ink)'
  return (
    <div ref={ref} className={`relative px-[var(--space-card-padding-x)] py-[var(--space-card-padding-y)] text-center ${tone === 'accent' ? 'text-accent-strong' : 'text-ink'} ${className}`}>
      {paths && size && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox={`0 0 ${size.width} ${size.height}`}>
          {paths.map((path, index) => (
            <path
              key={index}
              d={path.d}
              fill="none"
              stroke={path.type === 'fillSketch' ? 'var(--accent)' : stroke}
              strokeWidth={path.type === 'fillSketch' ? 0.9 : 1.5}
              strokeLinecap="round"
              opacity={path.type === 'fillSketch' ? 0.2 : 0.76}
            />
          ))}
        </svg>
      )}
      <div className="relative">
        <div className="text-xl font-medium">{title}</div>
        {sub && <div className="mt-1 text-sm text-ink-muted">{sub}</div>}
      </div>
    </div>
  )
}

export function Todo({ children, owner }: { children: ReactNode; owner: string }) {
  return (
    <div data-todo data-todo-owner={owner} className="rounded-[var(--radius-md)] border border-dashed border-warning/60 bg-warning/6 px-[var(--space-card-padding-x)] py-[var(--space-card-padding-y)] text-warning">
      <div className="text-lg font-medium">待补信息 · {children}</div>
      <div className="mt-2 text-sm opacity-80">确认人或来源：{owner}</div>
    </div>
  )
}
