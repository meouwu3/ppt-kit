import { defineDeck, defineSlides } from './deck'
import { DemoOverlay } from './overlay'

export const deck = defineDeck({
  id: 'ppt-demo',
  title: 'PPT 创作与导出',
  description: '网页放映，并导出 PNG、PDF 与 PPTX',
  date: '2026-07',
  theme: 'paper',
  overlay: DemoOverlay,
  slides: defineSlides(import.meta.glob('./slides/*.tsx', { eager: true })),
})
