import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { EASE, useClickSteps } from '../deck/ClickScope'
import { catmullRom, mulberry32, roughRectPath, wobble } from '../deck/rough'
import type { ReactNode } from 'react'

/* 手绘圈注：讲到关键处，当着观众把数字圈出来。
   没用 rough-notation——它按视口坐标摆 SVG，进了 transform: scale
   的画布会错位；自己画一份，笔迹带种子抖动，排练、放映、导出
   都是同一笔，风格也和墨梅同源。 */

type MarkType = 'circle' | 'underline' | 'box' | 'highlight'

function makePath(
  type: Exclude<MarkType, 'highlight'>,
  w: number,
  h: number,
  pad: number,
  rand: () => number,
) {
  if (type === 'circle') {
    // 椭圆一圈半：起笔左上，第二圈笔势略收，像真的用笔绕了两下
    const cx = w / 2
    const cy = h / 2
    const rx = w / 2 + pad + 8
    const ry = h / 2 + pad
    const steps = 30
    const sweep = Math.PI * 2 * 1.4
    const pts: Array<[number, number]> = []
    for (let i = 0; i <= steps; i++) {
      const t = Math.PI * 0.75 + (sweep * i) / steps
      const laps = (sweep * i) / steps / (Math.PI * 2)
      const shrink = 1 - Math.max(0, laps - 1) * 0.12
      pts.push([
        cx + Math.cos(t) * rx * shrink * (1 + wobble(rand, 0.04)),
        cy + Math.sin(t) * ry * shrink * (1 + wobble(rand, 0.05)),
      ])
    }
    return catmullRom(pts)
  }
  if (type === 'underline') {
    const y = h + pad * 0.6
    const steps = 7
    const pts: Array<[number, number]> = []
    for (let i = 0; i <= steps; i++)
      pts.push([
        (w * i) / steps + (i === 0 ? -3 : i === steps ? 4 : wobble(rand, 2)),
        y + wobble(rand, 1.8),
      ])
    return catmullRom(pts)
  }
  // box：外扩 pad 的手绘矩形
  return roughRectPath(w, h, -pad, rand)
}

export function Mark({
  at,
  type = 'circle',
  color = 'var(--accent)',
  strokeWidth = 2.5,
  padding = 6,
  seed = 7,
  className = '',
  children,
}: {
  /** 第几步画出来；不写则一直画着 */
  at?: number
  type?: MarkType
  color?: string
  strokeWidth?: number
  padding?: number
  /** 换个种子换一笔笔迹 */
  seed?: number
  className?: string
  children: ReactNode
}) {
  const { isOn, print } = useClickSteps(at ?? 0)
  const shown = at == null || isOn(at)

  const ref = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // offsetWidth 是布局尺寸，不吃画布的 transform: scale
    const ro = new ResizeObserver(() =>
      setSize({ w: el.offsetWidth, h: el.offsetHeight }),
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const m = padding + 12 + strokeWidth
  const d = useMemo(() => {
    if (!size || type === 'highlight') return ''
    return makePath(type, size.w, size.h, padding, mulberry32(seed))
  }, [size, type, padding, seed])

  return (
    <span ref={ref} className={`relative inline-block ${className}`}>
      {type === 'highlight' ? (
        print ? (
          shown && (
            <span
              aria-hidden="true"
              className="absolute rounded-xs"
              style={{
                inset: -padding * 0.5,
                background: color,
                opacity: 0.16,
                transform: 'rotate(-0.6deg)',
              }}
            />
          )
        ) : (
          <motion.span
            aria-hidden="true"
            className="absolute rounded-xs"
            style={{
              inset: -padding * 0.5,
              background: color,
              transformOrigin: 'left center',
              rotate: -0.6,
            }}
            initial={false}
            animate={{ scaleX: shown ? 1 : 0, opacity: shown ? 0.16 : 0 }}
            transition={{ duration: 0.6, ease: EASE }}
          />
        )
      ) : (
        size && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute"
            style={{
              left: -m,
              top: -m,
              width: size.w + 2 * m,
              height: size.h + 2 * m,
              overflow: 'visible',
            }}
            viewBox={`${-m} ${-m} ${size.w + 2 * m} ${size.h + 2 * m}`}
          >
            {print ? (
              shown && (
                <path
                  d={d}
                  fill="none"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={0.9}
                  style={{ stroke: color }}
                />
              )
            ) : (
              <motion.path
                d={d}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                style={{ stroke: color }}
                initial={false}
                animate={{
                  pathLength: shown ? 1 : 0,
                  opacity: shown ? 0.9 : 0,
                }}
                transition={{ duration: 0.8, ease: EASE }}
              />
            )}
          </svg>
        )
      )}
      <span className="relative">{children}</span>
    </span>
  )
}
