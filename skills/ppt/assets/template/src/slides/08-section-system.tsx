import { SectionSlide } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'system-section',
  title: '风格系统与内容规则',
  section: '系统',
  chrome: 'none',
}

export const notes = `第三章说明主题 token 与内容规则分别负责什么。`

export default function Slide() {
  return <SectionSlide index="03" title="风格系统与内容规则" />
}
