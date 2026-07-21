import { useCallback, useEffect, useRef, useState } from 'react'

type Msg = {
  from: string
  /** 发出时刻。没有或太旧的消息一律丢弃——bfcache 里冻结的页面
      会把频道消息攒成队列，复活时逐条送达；不设防的话，一个
      "幽灵"窗口能拿几分钟前的旧状态把现场牵着到处跑（实测过）。 */
  t: number
  page?: number
  c?: number
  syncReq?: boolean
}

const STALE_MS = 1500

/* 播放窗口和演讲者窗口之间的同步：同源 BroadcastChannel，
   谁翻页都广播，两边都跟。syncReq 让后开的窗口拿到当前进度。
   页面进 bfcache 前主动关频道（pagehide），不留排队的口子。 */
export function useDeckChannel(
  key: string | null,
  page: number,
  c: number,
  apply: (page: number, c: number) => void,
) {
  const [instanceId] = useState(() => Math.random().toString(36).slice(2))
  const chRef = useRef<BroadcastChannel | null>(null)
  const stateRef = useRef({ page, c })
  const applyRef = useRef(apply)
  useEffect(() => {
    stateRef.current = { page, c }
    applyRef.current = apply
  })

  useEffect(() => {
    if (!key || typeof BroadcastChannel === 'undefined') return

    const open = () => {
      if (chRef.current) return
      // 频道名带版本：热更新/旧部署残留的上下文（旧代码）连频道都对不上
      const ch = new BroadcastChannel(`deck:v2:${key}`)
      ch.onmessage = (e: MessageEvent) => {
        const m = e.data as Partial<Msg> | null
        if (!m || m.from === instanceId) return
        if (typeof m.t !== 'number' || Date.now() - m.t > STALE_MS) return
        if (m.syncReq) {
          // 后台窗口别抢答——它的状态多半是过时的
          if (document.visibilityState === 'hidden') return
          ch.postMessage({
            from: instanceId,
            t: Date.now(),
            ...stateRef.current,
          })
          return
        }
        if (typeof m.page === 'number' && typeof m.c === 'number') {
          const cur = stateRef.current
          if (m.page !== cur.page || m.c !== cur.c)
            applyRef.current(m.page, m.c)
        }
      }
      chRef.current = ch
    }
    const close = () => {
      chRef.current?.close()
      chRef.current = null
    }

    open()
    window.addEventListener('pagehide', close)
    window.addEventListener('pageshow', open)
    return () => {
      window.removeEventListener('pagehide', close)
      window.removeEventListener('pageshow', open)
      close()
    }
  }, [key, instanceId])

  useEffect(() => {
    /* 第四道防线：不可见的参与者不广播。整页导航的重叠窗口里，
       将死的旧 document 还能挂着新鲜时间戳把自己的旧页码广播出去
       （时间戳防线拦不住），把刚加载的新页面拽回老位置——实测过。
       幽灵广播时必然 hidden，活人（放映窗、演讲者窗）必然可见。 */
    if (document.visibilityState === 'hidden') return
    chRef.current?.postMessage({ from: instanceId, t: Date.now(), page, c })
  }, [instanceId, page, c])

  return useCallback(() => {
    chRef.current?.postMessage({
      from: instanceId,
      t: Date.now(),
      syncReq: true,
    })
  }, [instanceId])
}
