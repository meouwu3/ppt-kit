import type { ReactNode } from 'react'
import { SharedElementPlaceholder } from '../deck/overlays'

export function CoverSlide({
  title,
  subtitle,
  footer,
  background,
  visual,
}: {
  title: ReactNode
  subtitle?: ReactNode
  footer?: ReactNode
  background?: ReactNode
  visual?: ReactNode
}) {
  const hasVisual = visual != null
  return (
    <div className="absolute inset-0 overflow-hidden px-24 py-20">
      {background}
      {hasVisual && <div className="absolute inset-y-0 right-0 w-[47%]">{visual}</div>}
      <div className="relative z-10 flex h-full flex-col">
        <div className={`my-auto ${hasVisual ? 'max-w-[720px]' : 'max-w-[960px]'}`}>
          <h1 className="font-display text-[88px] leading-[1.08] font-semibold text-ink">{title}</h1>
          {subtitle && (
            <p className="mt-8 max-w-[760px] text-2xl leading-relaxed text-ink-muted">{subtitle}</p>
          )}
        </div>
        {footer && <div className="mt-auto pt-12 text-base text-ink-faint">{footer}</div>}
      </div>
    </div>
  )
}

export function SectionSlide({
  index,
  title,
  sharedTitle,
}: {
  index: string
  title: ReactNode
  sharedTitle?: string
}) {
  return (
    <div className="absolute inset-0 flex items-center px-28">
      <div className="stroke-numeral tnum w-[365px] shrink-0 font-display text-[21rem] leading-none font-semibold select-none">
        {index}
      </div>
      <div className="ml-16 border-l border-line-strong pl-14">
        <h2
          aria-hidden={sharedTitle ? true : undefined}
          className="font-display text-6xl leading-tight font-semibold text-ink"
        >
          {sharedTitle
            ? <SharedElementPlaceholder name={sharedTitle}>{title}</SharedElementPlaceholder>
            : title}
        </h2>
      </div>
    </div>
  )
}

export function ContentSlide({
  title,
  children,
  className = '',
  sharedTitle,
}: {
  title: ReactNode
  children: ReactNode
  className?: string
  sharedTitle?: string
}) {
  return (
    <div className="absolute inset-0 flex flex-col px-20 pt-16 pb-20">
      <header className="shrink-0">
        <h2
          aria-hidden={sharedTitle ? true : undefined}
          className="font-display text-5xl leading-tight font-semibold text-ink"
        >
          {sharedTitle
            ? <SharedElementPlaceholder name={sharedTitle}>{title}</SharedElementPlaceholder>
            : title}
        </h2>
        <div className="mt-6 h-px bg-line" />
      </header>
      <div className={`mt-[var(--space-title-body)] min-h-0 flex-1 ${className}`}>{children}</div>
    </div>
  )
}

export function CenterSlide({
  children,
  background,
}: {
  children: ReactNode
  background?: ReactNode
}) {
  return (
    <div className="absolute inset-0">
      {background}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-24 text-center">
        {children}
      </div>
    </div>
  )
}

export function Conclusion({
  claim,
  detail,
}: {
  claim: ReactNode
  detail?: ReactNode
}) {
  return (
    <div className="text-center text-2xl leading-relaxed">
      <span className="font-display font-semibold text-accent-strong">{claim}</span>
      {detail && <span className="text-ink-muted">{detail}</span>}
    </div>
  )
}
