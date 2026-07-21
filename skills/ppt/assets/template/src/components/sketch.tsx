import { useMemo } from 'react'
import { motion } from 'motion/react'
import { EASE, useClickAt } from '../deck/ClickScope'
import { catmullRom, mulberry32, roughRectPath, wobble } from '../deck/rough'
import type { ReactNode } from 'react'

type Tone = 'ink' | 'accent' | 'good' | 'warning' | 'danger'
type CharacterTone = 'ink' | 'accent'

const colorOf = (tone: Tone) => `var(--${tone})`
const PEN = { fill: 'none', strokeLinecap: 'round' } as const

function strokePath(
  points: Array<[number, number]>,
  random: () => number,
  amplitude = 1.1,
) {
  const sampled: Array<[number, number]> = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const [fromX, fromY] = points[index]
    const [toX, toY] = points[index + 1]
    for (let sample = 0; sample < 3; sample += 1) {
      const ratio = sample / 3
      sampled.push([
        fromX + (toX - fromX) * ratio + (index + sample === 0 ? 0 : wobble(random, amplitude)),
        fromY + (toY - fromY) * ratio + (index + sample === 0 ? 0 : wobble(random, amplitude)),
      ])
    }
  }
  sampled.push(points[points.length - 1])
  return catmullRom(sampled)
}

function circlePath(cx: number, cy: number, radius: number, random: () => number) {
  const points: Array<[number, number]> = []
  for (let index = 0; index <= 12; index += 1) {
    const angle = (Math.PI * 2 * index) / 12 - Math.PI / 2
    points.push([
      cx + Math.cos(angle) * (radius + wobble(random, 0.7)),
      cy + Math.sin(angle) * (radius + wobble(random, 0.7)),
    ])
  }
  points.push([points[0][0] + 2.5, points[0][1] + 1])
  return catmullRom(points)
}

export function SketchArrow({
  at,
  label,
  direction = 'right',
  tone = 'ink',
  seed = 7,
  width = 104,
  dashed = false,
  labelPosition = 'top',
  className = '',
}: {
  at?: number
  label?: ReactNode
  direction?: 'right' | 'left' | 'down' | 'up'
  tone?: Tone
  seed?: number
  width?: number
  dashed?: boolean
  labelPosition?: 'top' | 'bottom'
  className?: string
}) {
  const { active, print } = useClickAt(at)
  const horizontal = direction === 'right' || direction === 'left'
  const length = Math.max(width, 40)
  const svgWidth = horizontal ? length : 24
  const svgHeight = horizontal ? 24 : length
  const paths = useMemo(() => {
    const random = mulberry32(seed)
    const axis = 12
    let from: [number, number]
    let shaftEnd: [number, number]
    let tip: [number, number]
    let vector: [number, number]
    if (direction === 'right') {
      from = [2, axis]
      shaftEnd = [length - 9, axis]
      tip = [length - 6, axis]
      vector = [1, 0]
    } else if (direction === 'left') {
      from = [length - 2, axis]
      shaftEnd = [9, axis]
      tip = [6, axis]
      vector = [-1, 0]
    } else if (direction === 'down') {
      from = [axis, 2]
      shaftEnd = [axis, length - 9]
      tip = [axis, length - 6]
      vector = [0, 1]
    } else {
      from = [axis, length - 2]
      shaftEnd = [axis, 9]
      tip = [axis, 6]
      vector = [0, -1]
    }
    const perpendicular: [number, number] = [-vector[1], vector[0]]
    const base: [number, number] = [tip[0] - vector[0] * 13, tip[1] - vector[1] * 13]
    return {
      shaft: strokePath([from, shaftEnd], random),
      head: strokePath(
        [
          [base[0] + perpendicular[0] * 6, base[1] + perpendicular[1] * 6],
          tip,
          [base[0] - perpendicular[0] * 6, base[1] - perpendicular[1] * 6],
        ],
        random,
        0.7,
      ),
    }
  }, [direction, length, seed])
  const shown = print || active
  const labelNode = label && <div className="text-sm whitespace-nowrap text-ink-faint">{label}</div>

  return (
    <div className={`flex shrink-0 flex-col items-center gap-2 ${className}`}>
      {labelPosition === 'top' && labelNode}
      <svg aria-hidden="true" viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: svgWidth, height: svgHeight }}>
        <motion.path
          d={paths.shaft}
          {...PEN}
          stroke={colorOf(tone)}
          strokeWidth="1.8"
          strokeDasharray={dashed ? '7 5' : undefined}
          initial={false}
          animate={{ pathLength: shown ? 1 : 0, opacity: shown ? (dashed ? 0.5 : 0.7) : 0 }}
          transition={{ duration: print ? 0 : 0.5, ease: EASE }}
        />
        <motion.path
          d={paths.head}
          {...PEN}
          stroke={colorOf(tone)}
          strokeWidth="1.8"
          initial={false}
          animate={{ pathLength: shown ? 1 : 0, opacity: shown ? (dashed ? 0.5 : 0.7) : 0 }}
          transition={{ duration: print ? 0 : 0.22, delay: print ? 0 : 0.38, ease: EASE }}
        />
      </svg>
      {labelPosition === 'bottom' && labelNode}
    </div>
  )
}

export type CharacterPose =
  | 'stand'
  | 'design'
  | 'work'
  | 'panic'
  | 'cheer'
  | 'shrug'
  | 'dizzy'
  | 'request'
  | 'neutral'
  | 'point'
  | 'celebrate'
  | 'worry'

export type CharacterBubbleProps = {
  children: ReactNode
  at?: number
  align?: 'left' | 'center' | 'right'
  delay?: number
  className?: string
}

export function CharacterBubble({
  children,
  at,
  align = 'center',
  delay = 0,
  className = '',
}: CharacterBubbleProps) {
  const { active, print } = useClickAt(at)
  const alignClass =
    align === 'left'
      ? 'right-4 rounded-br-sm'
      : align === 'right'
        ? 'left-4 rounded-bl-sm'
        : 'left-1/2 -translate-x-1/2 rounded-bl-sm'
  return (
    <motion.div
      initial={false}
      animate={{ opacity: active ? 1 : 0, y: active ? 0 : 8 }}
      transition={{ duration: print ? 0 : 0.4, delay: active && !print ? delay : 0, ease: EASE }}
      className={`absolute bottom-full z-10 mb-2 -rotate-2 rounded-xl border border-ink/30 bg-paper px-3 py-2 text-sm whitespace-nowrap text-ink shadow-sm ${alignClass} ${className}`}
    >
      {children}
    </motion.div>
  )
}

type CanonicalPose = Exclude<CharacterPose, 'neutral' | 'point' | 'celebrate' | 'worry'>

const normalizePose = (pose: CharacterPose): CanonicalPose => {
  if (pose === 'neutral') return 'stand'
  if (pose === 'point') return 'design'
  if (pose === 'celebrate') return 'cheer'
  if (pose === 'worry') return 'panic'
  return pose
}

export function Character({
  pose = 'stand',
  kind = 'person',
  size = 'md',
  label,
  tone = 'ink',
  seed = 11,
  bubble,
  className = '',
}: {
  pose?: CharacterPose
  kind?: 'person' | 'robot'
  size?: 'sm' | 'md' | 'lg'
  label?: ReactNode
  tone?: CharacterTone
  seed?: number
  bubble?: CharacterBubbleProps
  className?: string
}) {
  const resolvedPose = normalizePose(pose)
  const drawing = useMemo(() => {
    const random = mulberry32(seed)
    const ink: Array<string> = [
      strokePath([[32, kind === 'robot' ? 26 : 25], [32, 56]], random),
      strokePath([[32, 56], [21, 84]], random),
      strokePath([[32, 56], [43, 84]], random),
    ]
    const accent: Array<string> = []
    const rings: Array<string> = []
    let laptop: string | null = null

    if (resolvedPose === 'design') {
      ink.push(strokePath([[32, 33], [18, 45]], random), strokePath([[32, 33], [46, 24]], random))
      accent.push(strokePath([[46, 24], [54, 15]], random))
    } else if (resolvedPose === 'request') {
      ink.push(strokePath([[32, 34], [19, 48]], random), strokePath([[32, 34], [46, 21]], random))
    } else if (resolvedPose === 'work') {
      ink.push(strokePath([[32, 33], [17, 46]], random), strokePath([[32, 33], [47, 46]], random))
      laptop = roughRectPath(34, 12, 1, random)
    } else if (resolvedPose === 'panic' || resolvedPose === 'cheer') {
      ink.push(strokePath([[32, 36], [19, 21]], random), strokePath([[32, 36], [45, 21]], random))
    } else if (resolvedPose === 'shrug') {
      ink.push(
        strokePath([[32, 36], [16, 31]], random),
        strokePath([[16, 31], [13, 27]], random, 0.5),
        strokePath([[32, 36], [48, 31]], random),
        strokePath([[48, 31], [51, 27]], random, 0.5),
      )
    } else if (resolvedPose === 'dizzy') {
      ink.push(strokePath([[32, 34], [22, 50]], random), strokePath([[32, 34], [42, 50]], random))
      rings.push(circlePath(46, 7, 3.5, random), circlePath(54, 4, 2.2, random))
    } else {
      ink.push(strokePath([[32, 34], [19, 49]], random), strokePath([[32, 34], [45, 49]], random))
    }

    if (kind === 'robot' && resolvedPose === 'stand') {
      ink.splice(3)
      ink.push(strokePath([[32, 33], [17, 46]], random), strokePath([[32, 33], [47, 46]], random))
      laptop = roughRectPath(34, 12, 1, random)
    }

    return {
      head: kind === 'person' ? circlePath(32, 15, 10, random) : roughRectPath(24, 19, 1, random),
      antenna: kind === 'robot' ? strokePath([[32, 7], [32, 2.5]], random, 0.6) : null,
      ink,
      accent,
      rings,
      laptop,
    }
  }, [kind, resolvedPose, seed])

  const dimensions = {
    sm: { width: 44, height: 64, minWidth: 72 },
    md: { width: 64, height: 88, minWidth: 92 },
    lg: { width: 72, height: 104, minWidth: 108 },
  }[size]
  const stroke = colorOf(tone)

  return (
    <figure className={`relative flex shrink-0 flex-col items-center ${className}`} style={{ minWidth: dimensions.minWidth }}>
      {bubble && <CharacterBubble {...bubble} />}
      <svg
        aria-hidden="true"
        viewBox="0 0 64 96"
        style={{ width: dimensions.width, height: dimensions.height }}
        className={resolvedPose === 'dizzy' ? 'rotate-6' : undefined}
      >
        {kind === 'robot' ? (
          <>
            {drawing.antenna && <path d={drawing.antenna} {...PEN} stroke="var(--accent)" strokeWidth="2" />}
            <circle cx="32" cy="2" r="2" fill="var(--accent)" fillOpacity="0.35" stroke="var(--accent)" strokeWidth="1.4" />
            <g transform="translate(20 7)">
              <path d={drawing.head} {...PEN} stroke={stroke} strokeWidth="2" opacity="0.8" />
            </g>
            <circle cx="27.5" cy="16" r="1.7" fill={stroke} opacity="0.75" />
            <circle cx="36.5" cy="16" r="1.7" fill={stroke} opacity="0.75" />
          </>
        ) : (
          <path d={drawing.head} {...PEN} stroke={stroke} strokeWidth="2" opacity="0.8" />
        )}
        {drawing.ink.map((path, index) => (
          <path key={index} d={path} {...PEN} stroke={stroke} strokeWidth="2" opacity="0.8" />
        ))}
        {drawing.accent.map((path, index) => (
          <path key={index} d={path} {...PEN} stroke="var(--accent)" strokeWidth="2.4" />
        ))}
        {drawing.rings.map((path, index) => (
          <path key={index} d={path} {...PEN} stroke={stroke} strokeWidth="1.4" opacity="0.45" />
        ))}
        {drawing.laptop && (
          <g transform="translate(15 41)">
            <path d={drawing.laptop} fill="var(--paper)" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
          </g>
        )}
      </svg>
      {label && (
        <figcaption data-audit-overflow className={`mt-2 max-w-36 text-center text-sm leading-snug ${tone === 'accent' ? 'font-medium text-accent-strong' : 'text-ink-muted'}`}>
          {label}
        </figcaption>
      )}
    </figure>
  )
}

export function MiniCharacter({ seed = 21, tone = 'ink' }: { seed?: number; tone?: CharacterTone }) {
  const paths = useMemo(() => {
    const random = mulberry32(seed)
    return [
      circlePath(11, 5.5, 4, random),
      strokePath([[11, 9.5], [11, 20]], random, 0.6),
      strokePath([[11, 20], [6, 30]], random, 0.6),
      strokePath([[11, 20], [16, 30]], random, 0.6),
      strokePath([[11, 13], [5, 17.5]], random, 0.6),
      strokePath([[11, 13], [17, 17.5]], random, 0.6),
    ]
  }, [seed])
  return (
    <svg viewBox="0 0 22 32" className="h-8 w-[22px]" aria-hidden="true">
      {paths.map((path, index) => (
        <path key={index} d={path} {...PEN} stroke={colorOf(tone)} strokeWidth="1.7" opacity={tone === 'accent' ? 0.95 : 0.55} />
      ))}
    </svg>
  )
}

export function PersonGlyph({ seed = 31, tone = 'ink' }: { seed?: number; tone?: CharacterTone }) {
  const paths = useMemo(() => {
    const random = mulberry32(seed)
    return {
      head: circlePath(16, 9, 6.5, random),
      shoulders: catmullRom([
        [4, 30 + wobble(random, 0.8)],
        [8, 22 + wobble(random, 0.8)],
        [16, 19 + wobble(random, 0.8)],
        [24, 22 + wobble(random, 0.8)],
        [28, 30 + wobble(random, 0.8)],
      ]),
    }
  }, [seed])
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
      <path d={paths.head} {...PEN} stroke={colorOf(tone)} strokeWidth="1.8" opacity={tone === 'accent' ? 0.9 : 0.6} />
      <path d={paths.shoulders} {...PEN} stroke={colorOf(tone)} strokeWidth="1.8" opacity={tone === 'accent' ? 0.9 : 0.6} />
    </svg>
  )
}

export function SpeechBubble({ children, tone = 'ink', className = '' }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <div className={`relative rounded-[6px] border bg-paper-raised px-4 py-2 text-sm leading-snug ${className}`} style={{ borderColor: colorOf(tone), color: colorOf(tone) }}>
      {children}
      <span aria-hidden="true" className="absolute -bottom-[5px] left-7 h-2.5 w-2.5 rotate-45 border-r border-b bg-paper-raised" style={{ borderColor: colorOf(tone) }} />
    </div>
  )
}

export function WarningStrip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`border-y border-dashed border-warning/45 bg-warning/7 px-6 py-3 text-center text-base font-medium text-warning ${className}`}>
      {children}
    </div>
  )
}
