import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { DeckDefinition, SlideMeta } from './types'
import { getSectionRange } from './types'

type PageContextValue = {
  deck: DeckDefinition
  page: number
  pages: number
  meta: SlideMeta
  print: boolean
  sectionRange: { start: number; end: number } | null
}

const PageContext = createContext<PageContextValue | null>(null)

export function DeckPageProvider({
  deck,
  page,
  print,
  children,
}: {
  deck: DeckDefinition
  page: number
  print: boolean
  children: ReactNode
}) {
  const value = useMemo<PageContextValue>(() => {
    const meta = deck.slides[page - 1]?.meta ?? {}
    const sectionRange = getSectionRange(deck.slides, meta.section)
    return {
      deck,
      page,
      pages: deck.slides.length,
      meta,
      print,
      sectionRange,
    }
  }, [deck, page, print])

  return <PageContext.Provider value={value}>{children}</PageContext.Provider>
}

export function useDeckPage() {
  const value = useContext(PageContext)
  if (!value) throw new Error('useDeckPage must be used inside DeckPageProvider')
  return value
}
