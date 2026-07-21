import evidence from '../assets/demo-evidence.svg'
import { Click } from '../deck'
import { BrowserFrame, ClaimEvidence, ContentSlide, Mark, Polaroid } from '../components'
import type { SlideMeta } from '../deck'

export const meta: SlideMeta = {
  id: 'evidence',
  title: '主张与证据',
  section: '证据',
  chrome: 'section',
}

export const notes = `证据页使用本地导入的演示界面图。真实演讲应替换为产品截图、奖状、报告或可复现的数据图。`

export default function Slide() {
  return (
    <ContentSlide
      title="主张与证据"
      sharedTitle="evidence-title"
    >
      <ClaimEvidence
        claim={<>结论旁边放上<Mark at={3} type="circle">实物证据</Mark></>}
        evidence={
          <div className="relative pr-10">
            <Click at={1}>
              <BrowserFrame url="local.preview">
                <img src={evidence} alt="演示产品的数据分析界面" className="block w-full" />
              </BrowserFrame>
            </Click>
            <Click at={2} effect="zoom" className="absolute -right-2 -bottom-8">
              <Polaroid caption="本地产物" rotate={3} tape>
                <img src={evidence} alt="演示产品界面缩略图" className="h-32 w-52 object-cover" />
              </Polaroid>
            </Click>
          </div>
        }
      />
    </ContentSlide>
  )
}
