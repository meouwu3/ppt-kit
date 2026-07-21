import { ContentSlide, SketchPipeline } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'system',
  title: '一次对话：从素材到可交付产物',
  section: '系统',
  chrome: 'section',
}

export const notes = `skills.sh 负责安装 skill，Vite 项目是每次对话的独立产物。预览只绑定 127.0.0.1。`

export default function Slide() {
  return (
    <ContentSlide title="一次对话：从素材到可交付产物">
      <div className="flex h-full items-center justify-center">
        <SketchPipeline
          nodes={[
            { title: '真实素材', sub: '数据 · 截图 · 观点' },
            { title: '$ppt', sub: '叙事 · 视觉 · 校验', tone: 'accent' },
            { title: 'Vite 预览', sub: '固定画布 · 现场放映' },
            { title: '交付产物', sub: 'PNG · PDF · PPTX' },
          ]}
        />
      </div>
    </ContentSlide>
  )
}
