/* 手绘笔迹的零件：Mark 的圈注/下划线/方框用这一支笔。
   （ArchBox 的手绘框走 rough.js——观众看惯的那种 sketchy 质感；
   这里的自绘笔迹专供批注类，一切抖动都吃种子，每次导出同一笔。） */

export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const wobble = (rand: () => number, amp: number) =>
  (rand() - 0.5) * 2 * amp

/* Catmull-Rom 过采样点 → 三次贝塞尔，笔迹的圆滑来自这里 */
export function catmullRom(pts: Array<[number, number]>) {
  const f = (n: number) => n.toFixed(1)
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)}, ${f(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${f(p2[1] - (p3[1] - p1[1]) / 6)}, ${f(p2[0])} ${f(p2[1])}`
  }
  return d
}

/** 手绘矩形：从 (inset,inset) 画到 (w-inset,h-inset)，inset 取负即外扩。
    每边采三个点带抖动，收笔与起笔轻微重叠，像一笔描完没对准。 */
export function roughRectPath(
  w: number,
  h: number,
  inset: number,
  rand: () => number,
) {
  const corners: Array<[number, number]> = [
    [inset, inset],
    [w - inset, inset],
    [w - inset, h - inset],
    [inset, h - inset],
  ]
  const pts: Array<[number, number]> = []
  for (let e = 0; e < 4; e++) {
    const [ax, ay] = corners[e]
    const [bx, by] = corners[(e + 1) % 4]
    for (let i = 0; i < 3; i++) {
      const t = i / 3
      pts.push([
        ax + (bx - ax) * t + wobble(rand, 1.6),
        ay + (by - ay) * t + wobble(rand, 1.6),
      ])
    }
  }
  pts.push([pts[0][0] + 4, pts[0][1] + 1.5])
  return catmullRom(pts)
}
