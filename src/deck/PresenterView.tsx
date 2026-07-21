import { useCallback, useEffect, useRef, useState } from 'react'
import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'
import { ClickScope } from './ClickScope'
import { DeckPageProvider } from './DeckContext'
import { PageChrome } from './PageChrome'
import { DeckOverlayHost } from './overlays'
import { SlideShell } from './SlideShell'
import { effectiveKey, toggleFullscreen } from './keys'
import { clickTotals } from './types'
import { useDeckChannel } from './useDeckChannel'
import type { DeckDefinition } from './types'

export function PresenterView({ deck }: { deck: DeckDefinition }) {
  const pages = deck.slides.length
  const [state, setState] = useState({ page: 1, click: 0 })
  const [totalInfo, setTotalInfo] = useState<{ page: number; total: number } | null>(null)
  const { page, click } = state
  const slide = deck.slides[page - 1]
  const Slide = slide.default
  const total = totalInfo?.page === page ? totalInfo.total : 0
  const totalOf = useCallback((target: number) => clickTotals.get(target), [])

  const go = useCallback(
    (target: number, targetClick: number) =>
      setState({
        page: Math.min(Math.max(target, 1), pages),
        click: Math.max(targetClick, 0),
      }),
    [pages],
  )
  const next = useCallback(() => {
    if (click < (totalOf(page) ?? 0)) go(page, click + 1)
    else if (page < pages) go(page + 1, 0)
  }, [click, go, page, pages, totalOf])
  const prev = useCallback(() => {
    if (click > 0) go(page, click - 1)
    else if (page > 1) go(page - 1, totalOf(page - 1) ?? 0)
  }, [click, go, page, totalOf])

  const requestSync = useDeckChannel(deck.id, page, click, go)
  useEffect(() => requestSync(), [requestSync])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      switch (effectiveKey(event)) {
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
        case 'f':
          void toggleFullscreen()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev])

  const nextState =
    click < total
      ? { page, click: click + 1 }
      : page < pages
        ? { page: page + 1, click: 0 }
        : null
  const NextSlide = nextState ? deck.slides[nextState.page - 1].default : null
  const iconButton =
    'flex h-10 w-10 items-center justify-center rounded-[5px] border border-white/15 text-white/70 hover:bg-white/8 hover:text-white'

  return (
    <div className="fixed inset-0 flex flex-col bg-[#111412] font-sans text-white/80 select-none">
      <header className="flex shrink-0 items-center justify-between px-6 py-4 text-sm text-white/45">
        <span>{deck.title}</span>
        <span className="tnum">
          {String(page).padStart(2, '0')} / {String(pages).padStart(2, '0')} · {click} / {total}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 gap-5 px-6 pb-6">
        <div className="flex min-w-0 flex-[3] flex-col gap-2">
          <div className="pointer-events-none relative min-h-0 flex-1 overflow-hidden rounded-[7px] border border-white/10">
            <SlideShell>
              <DeckPageProvider deck={deck} page={page} print={false}>
                <ClickScope
                  click={Math.min(click, total)}
                  onTotal={(value) => {
                    clickTotals.set(page, value)
                    setTotalInfo({ page, total: value })
                  }}
                >
                  <Slide />
                  <PageChrome />
                </ClickScope>
                <DeckOverlayHost deck={deck} page={page} print={false} />
              </DeckPageProvider>
            </SlideShell>
          </div>
          <div className="text-xs text-white/30">现场</div>
        </div>

        <div className="flex min-w-0 flex-[2] flex-col gap-4">
          <div>
            <div className="pointer-events-none relative aspect-video overflow-hidden rounded-[7px] border border-white/10">
              {nextState && NextSlide ? (
                <SlideShell>
                  <DeckPageProvider deck={deck} page={nextState.page} print>
                    <ClickScope click={nextState.click}>
                      <NextSlide />
                      <PageChrome />
                    </ClickScope>
                    <DeckOverlayHost deck={deck} page={nextState.page} print />
                  </DeckPageProvider>
                </SlideShell>
              ) : (
                <div className="flex h-full items-center justify-center text-white/25">结束</div>
              )}
            </div>
            <div className="mt-2 text-xs text-white/30">下一步</div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto rounded-[7px] bg-white/5 p-5 text-lg leading-relaxed whitespace-pre-line text-white/80">
            {slide.notes || <span className="text-white/30">这一页没有备注</span>}
          </div>

          <div className="flex shrink-0 items-center justify-between gap-4">
            <Timer />
            <div className="flex gap-2">
              <button className={iconButton} onClick={prev} title="上一步" aria-label="上一步">
                <SkipBack size={17} />
              </button>
              <button className={iconButton} onClick={next} title="下一步" aria-label="下一步">
                <SkipForward size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Timer() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const base = useRef({ accumulated: 0, startedAt: 0 })

  useEffect(() => {
    if (!running) return
    const tick = () =>
      setElapsed(
        base.current.accumulated + Math.floor((Date.now() - base.current.startedAt) / 1000),
      )
    tick()
    const timer = setInterval(tick, 500)
    return () => clearInterval(timer)
  }, [running])

  const toggle = () => {
    if (running) base.current.accumulated = elapsed
    else base.current.startedAt = Date.now()
    setRunning((value) => !value)
  }
  const reset = () => {
    base.current = { accumulated: 0, startedAt: Date.now() }
    setElapsed(0)
  }
  const iconButton =
    'flex h-8 w-8 items-center justify-center text-white/45 hover:text-white focus-visible:outline-2 focus-visible:outline-white'

  return (
    <div className="flex items-center gap-2">
      <span className="tnum mr-2 font-mono text-3xl text-white">
        {String(Math.floor(elapsed / 60)).padStart(2, '0')}:
        {String(elapsed % 60).padStart(2, '0')}
      </span>
      <button className={iconButton} onClick={toggle} title={running ? '暂停' : '开始'} aria-label={running ? '暂停' : '开始'}>
        {running ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <button className={iconButton} onClick={reset} title="清零" aria-label="清零">
        <RotateCcw size={15} />
      </button>
    </div>
  )
}
