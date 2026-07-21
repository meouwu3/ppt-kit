import { SectionSlide } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'content-section',
  title: '内容层级',
  section: '内容',
  chrome: 'none',
}

export const notes = `第一章说明怎样用信息层级安排页面内容。`

export default function Slide() {
  return <SectionSlide index="01" title="内容层级" />
}
