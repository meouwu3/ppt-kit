import { X } from 'lucide-react'
import { ClickScope } from './ClickScope'
import { DeckPageProvider } from './DeckContext'
import { PageChrome } from './PageChrome'
import { DeckOverlayHost } from './overlays'
import { SlideShell } from './SlideShell'
import type { DeckDefinition } from './types'

export function Overview({
  deck,
  page,
  onSelect,
  onClose,
}: {
  deck: DeckDefinition
  page: number
  onSelect: (page: number) => void
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-[#111412]/96 backdrop-blur-lg"
      onClick={(event) => {
        event.stopPropagation()
        onClose()
      }}
    >
      <button
        className="fixed top-5 right-5 z-10 flex h-10 w-10 items-center justify-center text-white/65 hover:text-white"
        onClick={onClose}
        title="关闭概览"
        aria-label="关闭概览"
      >
        <X size={20} />
      </button>
      <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-x-6 gap-y-8 px-10 py-16 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {deck.slides.map((slide, index) => {
          const Slide = slide.default
          const target = index + 1
          return (
            <button
              key={slide.meta?.id ?? target}
              className="group min-w-0 cursor-pointer text-left"
              onClick={(event) => {
                event.stopPropagation()
                onSelect(target)
              }}
            >
              <div
                className={`pointer-events-none relative aspect-video overflow-hidden rounded-[5px] border bg-paper transition-shadow group-hover:shadow-2xl ${
                  target === page ? 'border-accent ring-2 ring-accent/45' : 'border-white/15'
                }`}
              >
                <DeckPageProvider deck={deck} page={target} print>
                  <ClickScope click={0} print>
                    <SlideShell>
                      <Slide />
                      <PageChrome />
                      <DeckOverlayHost deck={deck} page={target} print />
                    </SlideShell>
                  </ClickScope>
                </DeckPageProvider>
              </div>
              <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                <span className="truncate text-white/70">{slide.meta?.title}</span>
                <span className="tnum shrink-0 text-white/40">{String(target).padStart(2, '0')}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
