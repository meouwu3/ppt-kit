import { Character, ContentSlide, SketchArrow, BeforeAfterStory } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'show-the-change',
  title: '需求交付流程：之前与现在',
  section: '内容',
  chrome: 'section',
}

export const notes = `动画不是转场装饰。人物、箭头和位置变化直接承担“之前为什么痛、现在为什么好”的论证。`

function Scene({ after = false }: { after?: boolean }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <Character pose={after ? 'request' : 'panic'} label="提出需求" seed={4} />
      <SketchArrow at={after ? 3 : 1} tone={after ? 'accent' : 'warning'} dashed={!after} seed={8} />
      <Character
        pose={after ? 'work' : 'shrug'}
        kind={after ? 'robot' : 'person'}
        label={after ? '自动完成' : '层层转述'}
        tone={after ? 'accent' : 'ink'}
        seed={12}
      />
    </div>
  )
}

export default function Slide() {
  return (
    <ContentSlide title="需求交付流程：之前与现在">
      <BeforeAfterStory
        before={<Scene />}
        warning="信息经过多次转述，错误直到交付才暴露"
        after={<Scene after />}
      />
    </ContentSlide>
  )
}
