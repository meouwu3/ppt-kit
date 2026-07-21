import type { ReactNode } from 'react'
import { Click } from '../deck/ClickScope'
import { ArchBox } from './metrics'
import { SketchArrow, WarningStrip } from './sketch'

export function ClaimEvidence({ claim, evidence }: { claim: ReactNode; evidence: ReactNode }) {
  return (
    <div className="grid h-full grid-cols-5 items-center gap-14">
      <div className="col-span-2 border-l-2 border-accent pl-8 font-display text-3xl leading-relaxed text-ink">{claim}</div>
      <div className="col-span-3">{evidence}</div>
    </div>
  )
}

export function SketchPipeline({
  nodes,
  startAt = 1,
}: {
  nodes: Array<{ title: ReactNode; sub?: ReactNode; tone?: 'plain' | 'accent' }>
  startAt?: number
}) {
  return (
    <div className="flex items-center justify-center">
      {nodes.map((node, index) => (
        <div key={index} className="flex items-center">
          <Click at={startAt + index} effect="zoom">
            <ArchBox hand title={node.title} sub={node.sub} tone={node.tone} className="min-w-48" />
          </Click>
          {index < nodes.length - 1 && <SketchArrow at={startAt + index + 1} seed={17 + index} />}
        </div>
      ))}
    </div>
  )
}

export function BeforeAfterStory({
  before,
  warning,
  after,
}: {
  before: ReactNode
  warning: ReactNode
  after: ReactNode
}) {
  return (
    <div className="flex h-full flex-col justify-center gap-7">
      <Click at={1} className="grid grid-cols-[150px_1fr] items-center gap-8">
        <div className="font-display text-4xl text-ink-faint">之前</div>
        <div>{before}</div>
      </Click>
      <Click at={2}><WarningStrip>{warning}</WarningStrip></Click>
      <Click at={3} className="grid grid-cols-[150px_1fr] items-center gap-8">
        <div className="font-display text-4xl text-accent">现在</div>
        <div>{after}</div>
      </Click>
    </div>
  )
}
