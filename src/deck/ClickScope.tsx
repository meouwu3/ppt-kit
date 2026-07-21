import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import type { Transition } from 'motion/react'

/* 一页幻灯片的步进作用域，仿 Slidev 的 clicks：
   - <Click> 包住的内容按步显现，不写 at 就按 DOM 顺序自动编号 1..n
   - 显式 at 直接采用；两者混用时总步数取最大值
   - print 模式（导出截图）一切可见、动画定格最终态
   总步数 total 决定「这一页还要按几下才翻页」。 */

export const EASE = [0.22, 1, 0.36, 1] as const

type Entry = { el: HTMLElement | null; at?: number }

type ClickScopeValue = {
  click: number
  print: boolean
  total: number
  autoAt: (id: string) => number | undefined
  register: (id: string, entry: Entry) => void
  unregister: (id: string) => void
}

export function clickTotal(entries: Array<{ at?: number }>) {
  let automatic = 0
  let maximumExplicit = 0
  for (const entry of entries) {
    if (entry.at == null) automatic += 1
    else maximumExplicit = Math.max(maximumExplicit, entry.at)
  }
  return Math.max(automatic, maximumExplicit)
}

const Ctx = createContext<ClickScopeValue | null>(null)
const ParentClickCtx = createContext<{ at?: number } | null>(null)

const useScope = () => {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('必须在 <ClickScope>（即一页幻灯片）内使用')
  return ctx
}

export function ClickScope({
  click,
  print = false,
  onTotal,
  children,
}: {
  click: number
  print?: boolean
  onTotal?: (total: number) => void
  children: ReactNode
}) {
  /* 注册表同时进 ref 和 state：ref 是同步真相（子组件的 layout effect
     一挂载就写进来），state 只为触发重渲染。总步数必须从 ref 里算、
     在 layout effect 里上报——挂载首帧 state 还是空 Map，若从 state 算
     会先报一次 0，Player 的收敛逻辑就会把 URL 里的 c 剪成 0
     （回退 5?c=0 → 4 落在 c=0 而不是最后一步，就是这么坏的） */
  const entriesRef = useRef(new Map<string, Entry>())
  const [entries, setEntries] = useState<ReadonlyMap<string, Entry>>(
    () => new Map(),
  )

  const register = useCallback((id: string, entry: Entry) => {
    entriesRef.current.set(id, entry)
    setEntries(new Map(entriesRef.current))
  }, [])
  const unregister = useCallback((id: string) => {
    if (!entriesRef.current.delete(id)) return
    setEntries(new Map(entriesRef.current))
  }, [])

  const { autoMap, total } = useMemo(() => {
    const autos: Array<[string, HTMLElement]> = []
    let maxExplicit = 0
    for (const [id, e] of entries) {
      if (e.at != null) maxExplicit = Math.max(maxExplicit, e.at)
      else if (e.el) autos.push([id, e.el])
    }
    autos.sort(([, a], [, b]) =>
      a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    return {
      autoMap: new Map(autos.map(([id], i) => [id, i + 1])),
      total: Math.max(autos.length, maxExplicit),
    }
  }, [entries])

  const reported = useRef(-1)
  useLayoutEffect(() => {
    let autos = 0
    let maxExplicit = 0
    for (const e of entriesRef.current.values()) {
      if (e.at != null) maxExplicit = Math.max(maxExplicit, e.at)
      else if (e.el) autos += 1
    }
    const t = Math.max(autos, maxExplicit)
    if (t !== reported.current) {
      reported.current = t
      onTotal?.(t)
    }
  })

  const autoAt = useCallback((id: string) => autoMap.get(id), [autoMap])

  const value = useMemo(
    () => ({ click, print, total, autoAt, register, unregister }),
    [click, print, total, autoAt, register, unregister],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

const VARIANTS = {
  rise: { hidden: { opacity: 0, y: 16 }, shown: { opacity: 1, y: 0 } },
  fade: { hidden: { opacity: 0 }, shown: { opacity: 1 } },
  zoom: {
    hidden: { opacity: 0, scale: 0.94 },
    shown: { opacity: 1, scale: 1 },
  },
} as const

export function Click({
  at,
  effect = 'rise',
  transition,
  layout = false,
  className,
  style,
  children,
}: {
  /** 第几步出现；不写则按 DOM 顺序自动编号 */
  at?: number
  effect?: keyof typeof VARIANTS
  transition?: Transition
  /** 兄弟元素出现导致自己位置变化时平滑滑过去（FLIP），不瞬移 */
  layout?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  const scope = useScope()
  const { print, register, unregister, autoAt, click } = scope
  const id = useId()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (print) return
    register(id, { el: ref.current, at })
    return () => unregister(id)
  }, [print, register, unregister, id, at])

  if (print)
    return (
      <ParentClickCtx.Provider value={{ at }}>
        <div className={className} style={style}>
          {children}
        </div>
      </ParentClickCtx.Provider>
    )

  const resolved = at ?? autoAt(id)
  const shown = resolved != null && click >= resolved
  return (
    <ParentClickCtx.Provider value={{ at: resolved }}>
      <motion.div
        ref={ref}
        className={className}
        style={style}
        initial={false}
        layout={layout}
        variants={VARIANTS[effect]}
        animate={shown ? 'shown' : 'hidden'}
        transition={transition ?? { duration: 0.5, ease: EASE }}
      >
        {children}
      </motion.div>
    </ParentClickCtx.Provider>
  )
}

/** 只读的步进状态（布局组件、被动效果用） */
export function useClicks() {
  const { click, print } = useScope()
  return {
    click,
    print,
    isOn: (at: number) => print || click >= at,
  }
}

/** 带 at 属性的内容组件用：把自己的步号计入本页总步数。
    BigNumber/Num/Compare/Mark 都靠它——组件写了 at={n} 而页面上
    没有别的 <Click>，总步数也得包含 n，否则那一步永远按不到。 */
export function clickAtActive(click: number, print: boolean, at?: number, nested = false) {
  if (print) return true
  if (at != null) return click >= at
  return !nested
}

export function resolveClickAt(at: number | undefined, parentAt: number | undefined, nested: boolean) {
  if (!nested) return at
  if (parentAt == null) return undefined
  return at == null ? parentAt : Math.max(parentAt, at)
}

export function useClickAt(at?: number) {
  const scope = useScope()
  const { print, register, unregister, click } = scope
  const parent = useContext(ParentClickCtx)
  const resolvedAt = resolveClickAt(at, parent?.at, parent != null)
  const id = useId()
  useLayoutEffect(() => {
    if (print || at == null) return
    register(id, { el: null, at })
    return () => unregister(id)
  }, [print, register, unregister, id, at])
  return {
    print,
    active: clickAtActive(click, print, resolvedAt, parent != null),
  }
}

/** 手写动画用：声明这一页共有 count 步，返回步进状态。
    不经过 <Click> 的自定义 motion 编排必须先在这里报数，
    否则这一页的 total 不含你的步数，会提前翻页。 */
export function useClickSteps(count: number) {
  const scope = useScope()
  const { print, register, unregister, click } = scope
  const id = useId()
  useLayoutEffect(() => {
    if (print) return
    register(id, { el: null, at: count })
    return () => unregister(id)
  }, [print, register, unregister, id, count])
  return {
    click,
    print,
    isOn: (at: number) => print || click >= at,
  }
}
