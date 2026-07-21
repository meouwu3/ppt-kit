import { Click } from '../deck'
import { CenterSlide, InkPlum } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'end',
  title: '交付前检查',
  section: '收尾',
  chrome: 'none',
}

export const notes = `收尾检查内容、证据和画面是否达到交付要求。`

export default function Slide() {
  return (
    <CenterSlide background={<InkPlum seed={42} />}>
      <Click at={1}>
        <h2 className="font-serif text-6xl leading-tight font-semibold text-ink">
          交付前检查
        </h2>
      </Click>
      <Click at={2}>
        <p className="mt-8 text-2xl text-ink-muted">内容准确 · 证据完整 · 画面清楚</p>
      </Click>
      <div aria-hidden="true" className="mt-10 h-24" />
    </CenterSlide>
  )
}
