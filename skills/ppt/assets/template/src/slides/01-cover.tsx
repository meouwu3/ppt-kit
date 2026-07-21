import { CoverSlide, InkPlum } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'cover',
  title: 'PPT 创作与导出',
  section: '开场',
  chrome: 'none',
}

export const notes = `开场说明这套系统用于网页放映，并交付 PNG、PDF 与 PPTX。`

export default function Slide() {
  return (
    <CoverSlide
      background={<InkPlum seed={42} />}
      title="PPT 创作与导出"
      subtitle="网页放映，并导出 PNG、PDF 与 PPTX"
    />
  )
}
