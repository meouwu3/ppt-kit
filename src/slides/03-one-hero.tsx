import { Click } from '../deck'
import { BigNumber, Character, ContentSlide, Mark } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'one-hero',
  title: '每页一个视觉主角',
  section: '内容',
  chrome: 'section',
}

export const notes = `页面只让一个信息成为主角。大数字、主图、关键结论三选一，其余内容退成证据或解释。`

export default function Slide() {
  return (
    <ContentSlide title="每页一个视觉主角">
      <div className="grid h-full grid-cols-[1.05fr_1fr] items-center gap-24">
        <Click at={1}>
          <BigNumber value={1} unit="个" label="视觉主角" at={1} />
        </Click>
        <div className="relative flex items-end justify-center">
          <Click at={2} effect="zoom">
            <Character
              pose="design"
              size="lg"
              label="讲述者"
              bubble={{
                at: 3,
                align: 'right',
                className: 'w-64 text-base leading-relaxed',
                children: <><span>标题说明主题</span><br /><Mark at={4} type="underline">数字提供证据</Mark></>,
              }}
            />
          </Click>
        </div>
      </div>
    </ContentSlide>
  )
}
