import { SectionSlide } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'evidence-section',
  title: '主张与证据',
  section: '证据',
  chrome: 'none',
}

export const notes = `第二章把截图、奖状、图表和数据放回主张旁边。观众不必等到附录才验证。`

export default function Slide() {
  return (
    <SectionSlide
      index="02"
      title="主张与证据"
      sharedTitle="evidence-title"
    />
  )
}
