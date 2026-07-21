import { useDeckPage } from './DeckContext'

const pad = (value: number) => String(value).padStart(2, '0')

export function PageNumber() {
  const { page, pages } = useDeckPage()
  return (
    <span className="tnum text-[13px] text-ink-faint">
      {pad(page)} / {pad(pages)}
    </span>
  )
}

export function SectionRange() {
  const { meta, sectionRange } = useDeckPage()
  if (!meta.section || !sectionRange) return <PageNumber />
  return (
    <span className="flex items-center gap-3 text-[13px] text-ink-faint">
      <span>{meta.section}</span>
      <span className="h-px w-8 bg-line-strong" />
      <span className="tnum">
        {pad(sectionRange.start)}-{pad(sectionRange.end)}
      </span>
    </span>
  )
}

export function PageChrome() {
  const { meta } = useDeckPage()
  const mode = meta.chrome ?? 'page'
  if (mode === 'none') return null
  return (
    <footer className="pointer-events-none absolute inset-x-14 bottom-9 z-20 flex items-center justify-between">
      {mode === 'section' ? <SectionRange /> : <span />}
      <PageNumber />
    </footer>
  )
}
