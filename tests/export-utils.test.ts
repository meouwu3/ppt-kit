import { describe, expect, it } from 'vitest'
import {
  contactSheetHtml,
  pageFile,
  parseFormats,
  parseRange,
  validateExportOptions,
  validateTemplateSlides,
} from '../scripts/export-utils.mjs'

const validOptions = {
  allowTodo: false,
  allowWarnings: false,
  draft: false,
  formats: ['png'],
}

describe('export utilities', () => {
  it('parses ranges and removes duplicates', () => {
    expect(parseRange('1-3,3,5', 5)).toEqual([1, 2, 3, 5])
    expect(() => parseRange('0-3', 5)).toThrow()
    expect(() => parseRange('4-8', 5)).toThrow()
  })

  it('validates formats and page filenames', () => {
    expect(parseFormats('png,pptx,png')).toEqual(['png', 'pptx'])
    expect(() => parseFormats('keynote')).toThrow('Unknown format')
    expect(pageFile(7)).toBe('page-07.png')
  })

  it('allows unresolved Todo only in draft PNG diagnostics', () => {
    expect(() => validateExportOptions({ ...validOptions, allowTodo: true, draft: true }))
      .not.toThrow()
    expect(() => validateExportOptions({ ...validOptions, allowTodo: true }))
      .toThrow('--allow-todo')
    expect(() => validateExportOptions({ ...validOptions, allowTodo: true, draft: true, formats: ['png', 'pptx'] }))
      .toThrow('--allow-todo')
  })

  it('keeps warning bypasses in drafts and prevents partial HTML audits', () => {
    expect(() => validateExportOptions({ ...validOptions, allowWarnings: true }))
      .toThrow('--allow-warnings')
    expect(() => validateExportOptions({ ...validOptions, allowWarnings: true, draft: true }))
      .not.toThrow()
    expect(() => validateExportOptions({ ...validOptions, formats: ['html'], range: '2-3' }))
      .toThrow('--range')
  })

  it('blocks generated starter slides from final export', () => {
    const slides = [
      { id: 'cover', title: '真实封面' },
      { id: 'starter', title: '核心内容', template: true },
    ]
    expect(() => validateTemplateSlides({ draft: false, slides })).toThrow('slide 2')
    expect(() => validateTemplateSlides({ draft: true, slides })).not.toThrow()
  })

  it('renders an escaped contact sheet for exported pages', () => {
    const html = contactSheetHtml({
      title: 'A < B',
      images: [{ page: 2, file: 'png/page-02.png' }],
    })
    expect(html).toContain('A &lt; B')
    expect(html).toContain('png/page-02.png')
    expect(html).toContain('<figcaption>02</figcaption>')
  })
})
