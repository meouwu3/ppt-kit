import { describe, expect, it } from 'vitest'
import { clickAtActive, clickTotal, resolveClickAt } from '../src/deck/ClickScope'
import { defineSlides, getSectionRange } from '../src/deck/types'
import type { SlideModule } from '../src/deck/types'

const Component = () => null

describe('slide definitions', () => {
  it('sorts filenames naturally', () => {
    const modules = {
      './slides/10-end.tsx': { default: Component },
      './slides/02-middle.tsx': { default: Component },
      './slides/01-cover.tsx': { default: Component },
    }
    expect(defineSlides(modules)).toEqual([
      modules['./slides/01-cover.tsx'],
      modules['./slides/02-middle.tsx'],
      modules['./slides/10-end.tsx'],
    ])
  })

  it('keeps template metadata available for export gates', () => {
    const slides = defineSlides({
      './slides/01-starter.tsx': { default: Component, meta: { template: true } },
    })
    expect(slides[0].meta?.template).toBe(true)
  })

  it('resolves section ranges from metadata', () => {
    const slides: SlideModule[] = [
      { default: Component, meta: { section: 'intro' } },
      { default: Component, meta: { section: 'work' } },
      { default: Component, meta: { section: 'work' } },
      { default: Component, meta: { section: 'end' } },
    ]
    expect(getSectionRange(slides, 'work')).toEqual({ start: 2, end: 3 })
    expect(getSectionRange(slides, 'missing')).toBeNull()
  })
})

describe('click accounting', () => {
  it('uses the larger of automatic count and explicit step', () => {
    expect(clickTotal([{ at: undefined }, { at: undefined }, { at: 4 }])).toBe(4)
    expect(clickTotal([{ at: undefined }, { at: undefined }, { at: 1 }])).toBe(2)
  })

  it('keeps nested animated values hidden until their parent Click resolves', () => {
    expect(clickAtActive(0, false, undefined, true)).toBe(false)
    expect(clickAtActive(0, false, 1, true)).toBe(false)
    expect(clickAtActive(1, false, 1, true)).toBe(true)
    expect(clickAtActive(0, true, undefined, true)).toBe(true)
  })

  it('never lets a nested animated value run before its parent Click', () => {
    expect(resolveClickAt(undefined, undefined, true)).toBeUndefined()
    expect(resolveClickAt(1, undefined, true)).toBeUndefined()
    expect(resolveClickAt(undefined, 3, true)).toBe(3)
    expect(resolveClickAt(1, 3, true)).toBe(3)
    expect(resolveClickAt(5, 3, true)).toBe(5)
    expect(resolveClickAt(2, undefined, false)).toBe(2)
  })
})
