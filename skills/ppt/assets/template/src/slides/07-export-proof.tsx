import { BigNumber, Compare, ContentSlide } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'export-proof',
  title: '导出耗时从 63.01 秒降至 7.38 秒',
  section: '证据',
  chrome: 'section',
}

export const notes = `2026-07-20 在原 talks.heyw.me 仓库实测 docs deck 共 10 页。旧脚本 63.01 秒；改用显式就绪信号后 7.38 秒，十张 PNG 逐像素一致。`

export default function Slide() {
  return (
    <ContentSlide title="导出耗时从 63.01 秒降至 7.38 秒">
      <div className="grid h-full grid-cols-[1fr_1.6fr] items-center gap-20">
        <BigNumber value={8.5} unit="×" precision={1} tone="good" label="同一套 10 页文档的实测提速" at={1} size="md" />
        <Compare label="导出耗时" before={63.01} after={7.38} unit="秒" precision={2} at={2} />
      </div>
    </ContentSlide>
  )
}
