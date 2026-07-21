import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export const SLIDE_W = 1280
export const SLIDE_H = 720

export function SlideShell({
  print = false,
  children,
}: {
  print?: boolean
  children: ReactNode
}) {
  const outer = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(print ? 1 : 0)

  useLayoutEffect(() => {
    if (print) return
    const element = outer.current
    if (!element) return
    const resize = () => {
      setScale(
        Math.min(element.clientWidth / SLIDE_W, element.clientHeight / SLIDE_H),
      )
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => observer.disconnect()
  }, [print])

  return (
    <div
      ref={outer}
      className="flex h-full w-full items-center justify-center overflow-hidden"
    >
      <main
        data-slide-canvas
        className="relative shrink-0 overflow-hidden bg-paper text-ink"
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: print ? undefined : `scale(${scale})`,
          visibility: print || scale > 0 ? 'visible' : 'hidden',
        }}
      >
        {children}
      </main>
    </div>
  )
}
