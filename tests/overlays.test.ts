import { describe, expect, it } from 'vitest'
import {
  CONTENT_TITLE_FRAME,
  DEFAULT_SIGNATURE_SLOTS,
  SECTION_TITLE_FRAME,
  completeCrossPageTarget,
  resolveSharedElementTarget,
  resolveSharedTitle,
  signatureModeForPage,
  signatureTarget,
} from '../src/deck/overlays'
import { defineDeck, resolveSlidePage } from '../src/deck/types'
import type { SlideModule } from '../src/deck/types'

const Component = () => null
const slides: SlideModule[] = [
  { default: Component, meta: { id: 'signature-intro' } },
  { default: Component, meta: { id: 'cover' } },
  { default: Component, meta: { id: 'content' } },
  { default: Component, meta: { id: 'end' } },
]

describe('cross-page targets', () => {
  it('resolves stable slide ids and validates numeric pages', () => {
    expect(resolveSlidePage(slides, 'cover')).toBe(2)
    expect(resolveSlidePage(slides, 4)).toBe(4)
    expect(() => resolveSlidePage(slides, 'missing')).toThrow('Unknown slide meta.id')
    expect(() => resolveSlidePage(slides, 5)).toThrow('out of range')
  })

  it('rejects duplicate ids before overlays depend on them', () => {
    expect(() => defineDeck({ id: 'x', title: 'x', slides: [slides[0], slides[0]] }))
      .toThrow('Duplicate slide meta.id')
  })

  it('keeps the signature in the expected four modes', () => {
    expect(signatureModeForPage(1, 1, 4)).toBe('cover')
    expect(signatureModeForPage(2, 1, 4)).toBe('corner')
    expect(signatureModeForPage(4, 1, 4)).toBe('closing')
    expect(signatureModeForPage(5, 1, 4)).toBe('gone')
  })

  it('converts center slots into complete deterministic boxes', () => {
    expect(signatureTarget('cover', 2, DEFAULT_SIGNATURE_SLOTS)).toEqual({
      x: 512,
      y: 284,
      width: 256,
      height: 128,
      opacity: 1,
    })
  })

  it('completes optional motion values and rejects invalid boxes', () => {
    expect(completeCrossPageTarget({ x: 1, y: 2, width: 3, height: 4 })).toEqual({
      x: 1,
      y: 2,
      width: 3,
      height: 4,
      opacity: 1,
      scale: 1,
      rotate: 0,
    })
    expect(() => completeCrossPageTarget({ x: 0, y: 0, width: 0, height: 4 }))
      .toThrow('positive width')
  })

  it('routes a shared element by stable slide id', () => {
    const frames = [
      { slide: 'cover', target: { x: 10, y: 20, width: 100, height: 40 } },
      { slide: 'content', target: { x: 50, y: 60, width: 200, height: 80, scale: 0.8 } },
    ]
    expect(resolveSharedElementTarget(slides, 2, frames)).toMatchObject({
      active: true,
      target: { x: 10, opacity: 1, scale: 1, rotate: 0 },
    })
    expect(resolveSharedElementTarget(slides, 3, frames)).toMatchObject({
      active: true,
      target: { x: 50, opacity: 1, scale: 0.8, rotate: 0 },
    })
  })

  it('uses deterministic hidden anchors before, between, and after frames', () => {
    const routedSlides: SlideModule[] = [
      { default: Component, meta: { id: 'before' } },
      { default: Component, meta: { id: 'first' } },
      { default: Component, meta: { id: 'between' } },
      { default: Component, meta: { id: 'second' } },
      { default: Component, meta: { id: 'after' } },
    ]
    const frames = [
      { slide: 'first', target: { x: 10, y: 20, width: 100, height: 40 } },
      { slide: 'second', target: { x: 50, y: 60, width: 200, height: 80 } },
    ]
    expect(resolveSharedElementTarget(routedSlides, 1, frames).target)
      .toMatchObject({ x: 10, opacity: 0 })
    expect(resolveSharedElementTarget(routedSlides, 3, frames).target)
      .toMatchObject({ x: 10, opacity: 0 })
    expect(resolveSharedElementTarget(routedSlides, 5, frames).target)
      .toMatchObject({ x: 50, opacity: 0 })
  })

  it('rejects incomplete or duplicate shared-element routes', () => {
    expect(() => resolveSharedElementTarget(slides, 2, [
      { slide: 'cover', target: { x: 0, y: 0, width: 1, height: 1 } },
    ])).toThrow('at least two frames')
    expect(() => resolveSharedElementTarget(slides, 2, [
      { slide: 'cover', target: { x: 0, y: 0, width: 1, height: 1 } },
      { slide: 'cover', target: { x: 1, y: 1, width: 1, height: 1 } },
    ])).toThrow('Duplicate shared-element frame')
    expect(() => resolveSharedElementTarget(slides, 2, [
      { slide: 'cover', target: { x: 0, y: 0, width: 1, height: 1 } },
      { slide: 'missing', target: { x: 1, y: 1, width: 1, height: 1 } },
    ])).toThrow('Unknown slide meta.id')
    expect(() => resolveSharedElementTarget(slides, 5, [
      { slide: 'cover', target: { x: 0, y: 0, width: 1, height: 1 } },
      { slide: 'content', target: { x: 1, y: 1, width: 1, height: 1 } },
    ])).toThrow('out of range')
  })

  it('keeps the section-to-content title frames aligned to their layouts', () => {
    expect(SECTION_TITLE_FRAME).toMatchObject({ x: 598, y: 323, scale: 1 })
    expect(CONTENT_TITLE_FRAME).toMatchObject({ x: 80, y: 64, scale: 0.8 })
  })

  it('requires shared titles to be adjacent and exactly equal', () => {
    const titleSlides: SlideModule[] = [
      { default: Component, meta: { id: 'section', title: '发布准备' } },
      { default: Component, meta: { id: 'content', title: '发布准备' } },
      { default: Component, meta: { id: 'later', title: '发布准备' } },
      { default: Component, meta: { id: 'different', title: '上线准备' } },
    ]
    expect(resolveSharedTitle(titleSlides, 'section', 'content')).toBe('发布准备')
    expect(() => resolveSharedTitle(titleSlides, 'section', 'later')).toThrow('adjacent')
    expect(() => resolveSharedTitle(titleSlides, 'later', 'different')).toThrow('match exactly')
  })
})
