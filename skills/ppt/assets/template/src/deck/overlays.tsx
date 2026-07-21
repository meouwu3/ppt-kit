import { useReducedMotion, motion } from 'motion/react'
import { EASE } from './ClickScope'
import { useDeckPage } from './DeckContext'
import { resolveSlidePage } from './types'
import type { ReactNode } from 'react'
import type { Transition } from 'motion/react'
import type { DeckDefinition } from './types'

export type CrossPageTarget = {
  x: number
  y: number
  width: number
  height: number
  opacity?: number
  scale?: number
  rotate?: number
}

export type CompleteCrossPageTarget = Required<CrossPageTarget>

export function completeCrossPageTarget(
  target: CrossPageTarget,
): CompleteCrossPageTarget {
  const complete = {
    ...target,
    opacity: target.opacity ?? 1,
    scale: target.scale ?? 1,
    rotate: target.rotate ?? 0,
  }
  const values = Object.values(complete)
  if (values.some((value) => !Number.isFinite(value)))
    throw new Error('Cross-page targets must contain only finite numbers')
  if (complete.width <= 0 || complete.height <= 0)
    throw new Error('Cross-page targets need positive width and height')
  return complete
}

export function CrossPageElement({
  target,
  print = false,
  duration = 0.75,
  transition,
  className = '',
  children,
  dataMode,
  dataSharedElement,
  dataSharedState,
  ariaHidden,
}: {
  target: CrossPageTarget
  print?: boolean
  duration?: number
  transition?: Transition
  className?: string
  children: ReactNode
  dataMode?: string
  dataSharedElement?: string
  dataSharedState?: 'active' | 'hidden'
  ariaHidden?: boolean
}) {
  const reduceMotion = useReducedMotion()
  const instant = print || Boolean(reduceMotion)
  return (
    <motion.div
      data-cross-page-element
      data-mode={dataMode}
      data-shared-element={dataSharedElement}
      data-shared-state={dataSharedState}
      aria-hidden={ariaHidden ?? (target.opacity ?? 1) <= 0}
      className={`pointer-events-none absolute top-0 left-0 z-30 ${className}`}
      style={{ transformOrigin: 'top left' }}
      initial={false}
      animate={{
        x: target.x,
        y: target.y,
        width: target.width,
        height: target.height,
        opacity: target.opacity ?? 1,
        scale: target.scale ?? 1,
        rotate: target.rotate ?? 0,
      }}
      transition={instant ? { duration: 0 } : transition ?? { duration, ease: EASE }}
    >
      {children}
    </motion.div>
  )
}

export type SharedElementFrame = {
  slide: string
  target: CrossPageTarget
}

export type ResolvedSharedElementTarget = {
  active: boolean
  target: CompleteCrossPageTarget
}

export function resolveSharedElementTarget(
  slides: DeckDefinition['slides'],
  page: number,
  frames: readonly SharedElementFrame[],
): ResolvedSharedElementTarget {
  if (frames.length < 2) throw new Error('A shared element needs at least two frames')
  const currentPage = resolveSlidePage(slides, page)

  const resolved = frames
    .map((frame) => ({
      page: resolveSlidePage(slides, frame.slide),
      slide: frame.slide,
      target: completeCrossPageTarget(frame.target),
    }))
    .sort((a, b) => a.page - b.page)

  const duplicate = resolved.find(
    (frame, index) => resolved.findIndex((item) => item.page === frame.page) !== index,
  )
  if (duplicate) throw new Error(`Duplicate shared-element frame: ${duplicate.slide}`)

  const exact = resolved.find((frame) => frame.page === currentPage)
  if (exact) return { active: true, target: exact.target }

  // Keep hidden pages deterministic: before the route use its first frame;
  // between/after frames use the nearest preceding frame.
  let anchor = resolved[0]
  for (const frame of resolved) {
    if (frame.page > currentPage) break
    anchor = frame
  }
  return {
    active: false,
    target: { ...anchor.target, opacity: 0 },
  }
}

export function SharedElement({
  name,
  page,
  frames,
  print = false,
  duration = 0.75,
  transition,
  className = '',
  children,
}: {
  name: string
  page: number
  frames: readonly SharedElementFrame[]
  print?: boolean
  duration?: number
  transition?: Transition
  className?: string
  children: ReactNode
}) {
  const { deck } = useDeckPage()
  if (!name.trim()) throw new Error('A shared element needs a semantic name')
  const resolved = resolveSharedElementTarget(deck.slides, page, frames)
  return (
    <CrossPageElement
      target={resolved.target}
      print={print}
      duration={duration}
      transition={transition}
      className={className}
      dataSharedElement={name}
      dataSharedState={resolved.active ? 'active' : 'hidden'}
      ariaHidden={!resolved.active}
    >
      {children}
    </CrossPageElement>
  )
}

export function SharedElementPlaceholder({
  name,
  as = 'span',
  className = '',
  children,
}: {
  name: string
  as?: 'span' | 'div'
  className?: string
  children: ReactNode
}) {
  const props = {
    'data-shared-element-placeholder': name,
    'aria-hidden': true,
    className: `invisible ${className}`,
  }
  return as === 'div'
    ? <div {...props}>{children}</div>
    : <span {...props}>{children}</span>
}

export const SECTION_TITLE_FRAME: CrossPageTarget = {
  x: 598,
  y: 323,
  width: 600,
  height: 75,
  opacity: 1,
  scale: 1,
  rotate: 0,
}

export const CONTENT_TITLE_FRAME: CrossPageTarget = {
  x: 80,
  y: 64,
  width: 600,
  height: 75,
  opacity: 1,
  scale: 0.8,
  rotate: 0,
}

export function resolveSharedTitle(
  slides: DeckDefinition['slides'],
  sectionId: string,
  contentId: string,
) {
  const sectionPage = resolveSlidePage(slides, sectionId)
  const contentPage = resolveSlidePage(slides, contentId)
  if (contentPage !== sectionPage + 1)
    throw new Error(`Shared title pages must be adjacent: ${sectionId} -> ${contentId}`)
  const sectionTitle = slides[sectionPage - 1].meta?.title
  const contentTitle = slides[contentPage - 1].meta?.title
  if (!sectionTitle || sectionTitle !== contentTitle)
    throw new Error(`Shared title text must match exactly: ${sectionId} -> ${contentId}`)
  return sectionTitle
}

export function SharedTitleFlight({
  name,
  page,
  sectionId,
  contentId,
  print = false,
  sectionTarget,
  contentTarget,
  className = '',
}: {
  name: string
  page: number
  sectionId: string
  contentId: string
  print?: boolean
  sectionTarget?: CrossPageTarget
  contentTarget?: CrossPageTarget
  className?: string
}) {
  const { deck } = useDeckPage()
  const title = resolveSharedTitle(deck.slides, sectionId, contentId)
  return (
    <SharedElement
      name={name}
      page={page}
      print={print}
      duration={0.8}
      frames={[
        { slide: sectionId, target: sectionTarget ?? SECTION_TITLE_FRAME },
        { slide: contentId, target: contentTarget ?? CONTENT_TITLE_FRAME },
      ]}
    >
      <h2
        className={`h-full w-full whitespace-nowrap font-display text-6xl leading-tight font-semibold text-ink ${className}`}
      >
        {title}
      </h2>
    </SharedElement>
  )
}

export type SignatureFlightMode = 'cover' | 'corner' | 'closing' | 'gone'

export type SignatureSlot = {
  cx: number
  cy: number
  height: number
  opacity: number
}

export type SignatureSlots = Record<SignatureFlightMode, SignatureSlot>

export const DEFAULT_SIGNATURE_SLOTS: SignatureSlots = {
  cover: { cx: 640, cy: 348, height: 128, opacity: 1 },
  corner: { cx: 1176, cy: 44, height: 32, opacity: 0.65 },
  closing: { cx: 640, cy: 434, height: 96, opacity: 1 },
  gone: { cx: 640, cy: 434, height: 96, opacity: 0 },
}

export function signatureModeForPage(
  page: number,
  coverPage: number,
  closingPage: number,
): SignatureFlightMode {
  if (page === coverPage) return 'cover'
  if (page === closingPage) return 'closing'
  if (page > coverPage && page < closingPage) return 'corner'
  return 'gone'
}

export function signatureTarget(
  mode: SignatureFlightMode,
  aspectRatio: number,
  slots: SignatureSlots = DEFAULT_SIGNATURE_SLOTS,
): CrossPageTarget {
  const slot = slots[mode]
  const width = slot.height * aspectRatio
  return {
    x: slot.cx - width / 2,
    y: slot.cy - slot.height / 2,
    width,
    height: slot.height,
    opacity: slot.opacity,
  }
}

export function SignatureFlight({
  page,
  coverId,
  closingId,
  render,
  print = false,
  aspectRatio = 124 / 82,
  slots = DEFAULT_SIGNATURE_SLOTS,
  className = 'text-ink',
}: {
  page: number
  coverId: string
  closingId: string
  render: (state: {
    mode: SignatureFlightMode
    instant: boolean
    className: string
  }) => ReactNode
  print?: boolean
  aspectRatio?: number
  slots?: SignatureSlots
  className?: string
}) {
  const { deck } = useDeckPage()
  const reduceMotion = useReducedMotion()
  const coverPage = resolveSlidePage(deck.slides, coverId)
  const closingPage = resolveSlidePage(deck.slides, closingId)
  if (coverPage >= closingPage)
    throw new Error(`Signature cover must precede closing: ${coverId} -> ${closingId}`)
  const mode = signatureModeForPage(page, coverPage, closingPage)
  const instant = print || Boolean(reduceMotion)
  return (
    <CrossPageElement
      target={signatureTarget(mode, aspectRatio, slots)}
      print={instant}
      duration={0.9}
      className={className}
      dataMode={mode}
      ariaHidden={mode !== 'cover'}
    >
      <div key={mode} className="h-full w-full">
        {render({ mode, instant, className: 'h-full w-full' })}
      </div>
    </CrossPageElement>
  )
}

export function DeckOverlayHost({
  deck,
  page,
  print,
}: {
  deck: DeckDefinition
  page: number
  print: boolean
}) {
  const Overlay = deck.overlay
  return Overlay ? <Overlay page={page} print={print} /> : null
}
