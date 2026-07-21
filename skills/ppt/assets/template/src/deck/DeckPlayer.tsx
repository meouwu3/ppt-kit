import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Maximize,
  Presentation,
} from 'lucide-react'
import { ClickScope, EASE } from './ClickScope'
import { DeckPageProvider } from './DeckContext'
import { Overview } from './Overview'
import { DeckOverlayHost } from './overlays'
import { PageChrome } from './PageChrome'
import { PresenterView } from './PresenterView'
import { SlideShell } from './SlideShell'
import { effectiveKey, toggleFullscreen } from './keys'
import { clickTotals } from './types'
import { useDeckChannel } from './useDeckChannel'
import type { DeckDefinition } from './types'

export type SlideAudit = {
  page: number
  todos: string[]
  overflows: string[]
  imagesWithoutAlt: string[]
}

export type PptExportApi = {
  manifest: {
    id: string
    title: string
    description?: string
    author?: string
    date?: string
    pages: number
    slides: Array<{ id: string; title?: string; notes?: string; template?: boolean }>
  }
  show: (page: number) => Promise<SlideAudit>
  audit: () => SlideAudit
}

declare global {
  interface Window {
    __PPT_EXPORT__?: PptExportApi
  }
}

const query = () => new URLSearchParams(window.location.search)

function parseHash(pages: number) {
  const match = window.location.hash.match(/^#(\d+)(?:\/(\d+))?$/)
  return {
    page: Math.min(Math.max(Number(match?.[1]) || 1, 1), pages),
    click: Math.max(Number(match?.[2]) || 0, 0),
  }
}

function updateHash(page: number, click: number) {
  const hash = `#${page}${click > 0 ? `/${click}` : ''}`
  if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
}

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

function waitForExportReady(element: Element) {
  if (element.getAttribute('data-export-ready') === '1') return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (element.getAttribute('data-export-ready') !== '1') return
      clearTimeout(timeout)
      observer.disconnect()
      resolve()
    })
    const timeout = window.setTimeout(() => {
      observer.disconnect()
      reject(new Error('Timed out waiting for a visual component to finish rendering'))
    }, 15_000)
    observer.observe(element, { attributes: true, attributeFilter: ['data-export-ready'] })
  })
}

async function waitForSlide() {
  await document.fonts.ready
  const canvas = document.querySelector<HTMLElement>('[data-slide-canvas]')
  const images = [...(canvas?.querySelectorAll('img') ?? [])]
  await Promise.all(
    images.map((image) =>
      image.complete ? image.decode().catch(() => undefined) : image.decode(),
    ),
  )
  const renderers = [...(canvas?.querySelectorAll('[data-export-ready]') ?? [])]
  await Promise.all(renderers.map(waitForExportReady))
  await frame()
  await frame()
}

function describeElement(element: Element) {
  const text = element.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80)
  return text || element.tagName.toLowerCase()
}

function auditSlide(page: number): SlideAudit {
  const canvas = document.querySelector<HTMLElement>('[data-slide-canvas]')
  if (!canvas) return { page, todos: [], overflows: ['slide canvas missing'], imagesWithoutAlt: [] }

  const todos = [...canvas.querySelectorAll('[data-todo]')].map(describeElement)
  const canvasRect = canvas.getBoundingClientRect()
  const candidates = canvas.querySelectorAll('h1,h2,h3,h4,p,li,figcaption,code,[data-audit-overflow]')
  const overflows = [...candidates]
    .filter((node): node is HTMLElement => node instanceof HTMLElement)
    .filter((node) => {
      const rect = node.getBoundingClientRect()
      const outsideCanvas =
        rect.left < canvasRect.left - 2 ||
        rect.top < canvasRect.top - 2 ||
        rect.right > canvasRect.right + 2 ||
        rect.bottom > canvasRect.bottom + 2
      const constrained = node.hasAttribute('data-audit-overflow')
      const clipped =
        constrained &&
        (node.scrollWidth > node.clientWidth + 2 || node.scrollHeight > node.clientHeight + 2)
      return outsideCanvas || clipped
    })
    .map(describeElement)
  const imagesWithoutAlt = [...canvas.querySelectorAll('img')]
    .filter((image) => !image.hasAttribute('alt'))
    .map((image) => image.getAttribute('src') ?? 'image')

  return { page, todos, overflows, imagesWithoutAlt }
}

export function DeckPlayer({ deck }: { deck: DeckDefinition }) {
  const options = query()
  const print = options.get('print') === '1'
  const presenter = options.get('presenter') === '1'

  useEffect(() => {
    document.title = deck.title
    document.documentElement.dataset.theme = deck.theme ?? 'paper'
  }, [deck.theme, deck.title])

  if (presenter && !print) return <PresenterView deck={deck} />
  return <Player deck={deck} print={print} />
}

function Player({ deck, print }: { deck: DeckDefinition; print: boolean }) {
  const initial = parseHash(deck.slides.length)
  const [page, setPage] = useState(initial.page)
  const [click, setClick] = useState(print ? 0 : initial.click)
  const [totalInfo, setTotalInfo] = useState<{ page: number; total: number } | null>(null)
  const [overview, setOverview] = useState(false)
  const [digits, setDigits] = useState('')
  const digitsTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingExport = useRef<{
    page: number
    resolve: (audit: SlideAudit) => void
    reject: (error: Error) => void
  } | null>(null)

  const pages = deck.slides.length
  const slide = deck.slides[page - 1]
  const Slide = slide.default
  const knownTotal = totalInfo?.page === page ? totalInfo.total : undefined
  const totalOf = useCallback((target: number) => clickTotals.get(target), [])

  const go = useCallback(
    (targetPage: number, targetClick: number) => {
      const nextPage = Math.min(Math.max(targetPage, 1), pages)
      setPage(nextPage)
      setClick(Math.max(targetClick, 0))
      if (!print) updateHash(nextPage, Math.max(targetClick, 0))
    },
    [pages, print],
  )

  const onTotal = useCallback(
    (total: number) => {
      clickTotals.set(page, total)
      setTotalInfo({ page, total })
    },
    [page],
  )

  const next = useCallback(() => {
    if (click < (totalOf(page) ?? 0)) go(page, click + 1)
    else if (page < pages) go(page + 1, 0)
  }, [click, go, page, pages, totalOf])

  const prev = useCallback(() => {
    if (click > 0) go(page, click - 1)
    else if (page > 1) go(page - 1, totalOf(page - 1) ?? 999)
  }, [click, go, page, totalOf])

  const jumpFull = useCallback(
    (target: number) => go(target, totalOf(target) ?? 999),
    [go, totalOf],
  )

  useEffect(() => {
    if (print || knownTotal == null || click <= knownTotal) return
    go(page, knownTotal)
  }, [click, go, knownTotal, page, print])

  useEffect(() => {
    if (print) return
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        return
      const key = effectiveKey(event)
      if (key === 'o' || key === 'g') {
        setOverview((value) => !value)
        setDigits('')
        return
      }
      if (key === 'Escape') {
        setOverview(false)
        setDigits('')
        return
      }
      if (overview) return
      if (/^\d$/.test(key)) {
        setDigits((value) => (value + key).slice(-3))
        if (digitsTimer.current) clearTimeout(digitsTimer.current)
        digitsTimer.current = setTimeout(() => setDigits(''), 1600)
        return
      }
      if (key === 'Enter' && digits) {
        jumpFull(Number(digits))
        setDigits('')
        return
      }
      switch (key) {
        case ' ':
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
          event.preventDefault()
          next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          event.preventDefault()
          prev()
          break
        case 'Home':
          go(1, 0)
          break
        case 'End':
          jumpFull(pages)
          break
        case 'f':
          void toggleFullscreen()
          break
        case 'p':
          window.open(`${window.location.pathname}?presenter=1`, `${deck.id}-presenter`, 'width=1440,height=900')
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [deck.id, digits, go, jumpFull, next, overview, pages, prev, print])

  useDeckChannel(print ? null : deck.id, page, click, go)

  useEffect(() => {
    if (!print) return
    const slides = deck.slides.map((item, index) => ({
      id: item.meta?.id ?? `slide-${index + 1}`,
      title: item.meta?.title,
      notes: item.notes,
      template: item.meta?.template,
    }))
    window.__PPT_EXPORT__ = {
      manifest: {
        id: deck.id,
        title: deck.title,
        description: deck.description,
        author: deck.author,
        date: deck.date,
        pages,
        slides,
      },
      show: (target) =>
        new Promise<SlideAudit>((resolve, reject) => {
          const requested = Math.min(Math.max(Math.floor(target), 1), pages)
          pendingExport.current = { page: requested, resolve, reject }
          if (requested === page) {
            void waitForSlide()
              .then(() => resolve(auditSlide(requested)))
              .catch((error: unknown) => reject(error instanceof Error ? error : new Error(String(error))))
            pendingExport.current = null
          } else {
            setPage(requested)
          }
        }),
      audit: () => auditSlide(page),
    }
    return () => {
      delete window.__PPT_EXPORT__
    }
  }, [deck, page, pages, print])

  useLayoutEffect(() => {
    if (!print || pendingExport.current?.page !== page) return
    const pending = pendingExport.current
    pendingExport.current = null
    void waitForSlide()
      .then(() => pending.resolve(auditSlide(page)))
      .catch((error: unknown) =>
        pending.reject(error instanceof Error ? error : new Error(String(error))),
      )
  }, [page, print])

  const [pageMemo, setPageMemo] = useState({ page, direction: 1 })
  if (pageMemo.page !== page)
    setPageMemo({ page, direction: page > pageMemo.page ? 1 : -1 })
  const direction = pageMemo.direction

  return (
    <div
      className={print ? 'h-[720px] w-[1280px]' : 'fixed inset-0 select-none'}
      onClick={print ? undefined : next}
    >
      <SlideShell print={print}>
        <DeckPageProvider deck={deck} page={page} print={print}>
          {print ? (
            <ClickScope click={0} print>
              <Slide />
              <PageChrome />
            </ClickScope>
          ) : (
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={page}
                className="absolute inset-0"
                custom={direction}
                variants={{
                  enter: (value: number) => ({ opacity: 0, x: 28 * value }),
                  center: { opacity: 1, x: 0 },
                  exit: (value: number) => ({ opacity: 0, x: -28 * value }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: EASE }}
              >
                <ClickScope
                  click={knownTotal == null ? click : Math.min(click, knownTotal)}
                  onTotal={onTotal}
                >
                  <Slide />
                  <PageChrome />
                </ClickScope>
              </motion.div>
            </AnimatePresence>
          )}
          <DeckOverlayHost deck={deck} page={page} print={print} />
        </DeckPageProvider>
      </SlideShell>

      {!print && overview && (
        <Overview
          deck={deck}
          page={page}
          onClose={() => setOverview(false)}
          onSelect={(target) => {
            setOverview(false)
            jumpFull(target)
          }}
        />
      )}
      {!print && digits && (
        <div className="fixed bottom-7 left-7 z-40 rounded-[var(--radius-sm)] border border-line bg-paper-raised px-3 py-2 font-mono text-sm text-ink-muted shadow-[var(--shadow-soft)]">
          {digits}
        </div>
      )}
      {!print && !overview && (
        <PlayerToolbar
          onPrev={prev}
          onNext={next}
          onOverview={() => setOverview(true)}
          onPresenter={() =>
            window.open(`${window.location.pathname}?presenter=1`, `${deck.id}-presenter`, 'width=1440,height=900')
          }
        />
      )}
      {!print && (
        <div className="fixed inset-x-0 bottom-0 z-30 h-0.5 bg-white/5">
          <div
            className="h-full bg-accent transition-[width] duration-300"
            style={{
              width: `${((page - 1 + (knownTotal ? Math.min(click, knownTotal) / knownTotal : 0)) / pages) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}

function PlayerToolbar({
  onPrev,
  onNext,
  onOverview,
  onPresenter,
}: {
  onPrev: () => void
  onNext: () => void
  onOverview: () => void
  onPresenter: () => void
}) {
  const button =
    'flex h-9 w-9 items-center justify-center text-white/70 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'
  return (
    <nav
      className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center overflow-hidden rounded-[6px] border border-white/12 bg-[#171a18]/92 shadow-xl backdrop-blur"
      onClick={(event) => event.stopPropagation()}
      aria-label="放映控制"
    >
      <button className={button} onClick={onPrev} title="上一步" aria-label="上一步">
        <ChevronLeft size={17} />
      </button>
      <button className={button} onClick={onNext} title="下一步" aria-label="下一步">
        <ChevronRight size={17} />
      </button>
      <span className="h-5 w-px bg-white/10" />
      <button className={button} onClick={onOverview} title="概览" aria-label="概览">
        <Grid2X2 size={16} />
      </button>
      <button className={button} onClick={onPresenter} title="演讲者模式" aria-label="演讲者模式">
        <Presentation size={17} />
      </button>
      <button className={button} onClick={() => void toggleFullscreen()} title="全屏" aria-label="全屏">
        <Maximize size={16} />
      </button>
    </nav>
  )
}
