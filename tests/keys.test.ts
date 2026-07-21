import { describe, expect, it } from 'vitest'
import { effectiveKey } from '../src/deck/keys'

describe('effectiveKey', () => {
  it('normalizes uppercase shortcuts', () => {
    expect(effectiveKey({ key: 'F', code: 'KeyF', isComposing: false } as KeyboardEvent)).toBe('f')
  })

  it('recovers physical keys while an IME is composing', () => {
    expect(effectiveKey({ key: 'Process', code: 'KeyO', isComposing: true } as KeyboardEvent)).toBe('o')
    expect(effectiveKey({ key: 'Process', code: 'Digit7', isComposing: true } as KeyboardEvent)).toBe('7')
    expect(effectiveKey({ key: 'Process', code: 'Space', isComposing: true } as KeyboardEvent)).toBe(' ')
  })
})
