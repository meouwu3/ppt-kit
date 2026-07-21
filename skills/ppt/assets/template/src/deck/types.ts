import type { ComponentType } from 'react'

export type SlideChrome = 'none' | 'page' | 'section'

export type SlideMeta = {
  id?: string
  title?: string
  section?: string
  chrome?: SlideChrome
  /** Marks generated starter content that must be replaced before final export. */
  template?: boolean
}

export type SlideModule = {
  default: ComponentType
  notes?: string
  meta?: SlideMeta
}

export type DeckOverlayProps = {
  page: number
  print: boolean
}

export type DeckDefinition = {
  id: string
  title: string
  description?: string
  author?: string
  date?: string
  theme?: string
  slides: SlideModule[]
  /** Persistent canvas layer for elements that move between slides. */
  overlay?: ComponentType<DeckOverlayProps>
}

export function defineDeck(deck: DeckDefinition): DeckDefinition {
  if (deck.slides.length === 0) throw new Error('A deck needs at least one slide')
  const ids = deck.slides.flatMap((slide) => slide.meta?.id ? [slide.meta.id] : [])
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index)
  if (duplicate) throw new Error(`Duplicate slide meta.id: ${duplicate}`)
  return deck
}

export function defineSlides(modules: Record<string, unknown>): SlideModule[] {
  return Object.keys(modules)
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }))
    .map((path) => modules[path] as SlideModule)
}

export function getSectionRange(slides: SlideModule[], section?: string) {
  if (!section) return null
  const pages = slides
    .map((slide, index) => ({ section: slide.meta?.section, page: index + 1 }))
    .filter((item) => item.section === section)
    .map((item) => item.page)
  return pages.length ? { start: pages[0], end: pages.at(-1)! } : null
}

export function resolveSlidePage(slides: SlideModule[], target: number | string) {
  if (typeof target === 'number') {
    if (!Number.isInteger(target) || target < 1 || target > slides.length)
      throw new Error(`Slide page is out of range: ${target}`)
    return target
  }
  const index = slides.findIndex((slide) => slide.meta?.id === target)
  if (index < 0) throw new Error(`Unknown slide meta.id: ${target}`)
  return index + 1
}

export const clickTotals = new Map<number, number>()
