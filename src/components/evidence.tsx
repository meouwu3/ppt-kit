import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { EASE, useClicks } from '../deck/ClickScope'
import type { CSSProperties, ReactNode } from 'react'

/* 证据陈列：产品截图和实物照片统一穿上适合演示的外框。 */

/** macOS 浏览器窗口壳：产品截图的正装 */
export function BrowserFrame({
  url,
  children,
  className = '',
}: {
  url?: string
  children: ReactNode
  className?: string
}) {
  return (
    <figure
      className={`overflow-hidden rounded-xl border border-line bg-paper shadow-[0_18px_50px_-20px_rgba(28,28,26,0.3)] ${className}`}
    >
      <div className="relative flex h-9 shrink-0 items-center border-b border-line bg-ink/3 px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full border border-ink-faint/60"
            />
          ))}
        </span>
        {url && (
          <span className="absolute left-1/2 -translate-x-1/2 rounded-md border border-line bg-paper px-3 py-0.5 font-mono text-[11px] whitespace-nowrap text-ink-faint">
            {url}
          </span>
        )}
      </div>
      <div className="bg-paper">{children}</div>
    </figure>
  )
}

/** 拍立得：奖状、照片的实物感。rotate 给一点手放上去的随意。
    传 expanded（通常是不裁剪的全图）即可点击查看：portal 到 body
    的遮罩层里从倾角旋转放正——脱离 scale 画布，坐标不吃缩放；
    再点或 Esc 放回去。print / 概览缩略图下自动禁用。 */
export function Polaroid({
  caption,
  rotate = -2,
  tape = false,
  expanded,
  children,
  className = '',
  style,
}: {
  caption?: ReactNode
  rotate?: number
  /** 顶上贴一截胶带 */
  tape?: boolean
  /** 点击放大后展示的内容；不传则不可点 */
  expanded?: ReactNode
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  const { print } = useClicks()
  const [open, setOpen] = useState(false)
  const expandable = expanded != null && !print

  // Esc 收回；capture + stopPropagation，别让放映键位把页翻了
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <>
      <figure
        className={`relative inline-block bg-white p-3 pb-4 shadow-[0_14px_40px_-16px_rgba(28,28,26,0.4)] transition-opacity duration-300 ${
          expandable ? 'cursor-zoom-in' : ''
        } ${open ? 'opacity-0' : ''} ${className}`}
        style={{ transform: `rotate(${rotate}deg)`, ...style }}
        // stopPropagation：播放器整页 onClick 是翻页，别让点开变成翻走
        onClick={
          expandable
            ? (e) => {
                e.stopPropagation()
                setOpen(true)
              }
            : undefined
        }
      >
        {tape && (
          <span
            aria-hidden="true"
            className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 -rotate-3 bg-ink/8"
          />
        )}
        <div className="overflow-hidden bg-line/40">{children}</div>
        {caption && (
          <figcaption className="mt-3 text-center font-display text-sm text-ink-muted">
            {caption}
          </figcaption>
        )}
      </figure>
      {expandable &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-ink/50 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                // portal 的合成事件仍沿 React 树冒泡回播放器，同样要拦
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                }}
              >
                <motion.figure
                  className="bg-white p-4 pb-5 shadow-[0_30px_80px_-24px_rgba(28,28,26,0.55)]"
                  initial={{ scale: 0.5, rotate, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.5, rotate, opacity: 0 }}
                  transition={{ duration: 0.45, ease: EASE }}
                >
                  <div className="overflow-hidden bg-line/40">{expanded}</div>
                  {caption && (
                    <figcaption className="mt-3 text-center font-display text-base text-ink-muted">
                      {caption}
                    </figcaption>
                  )}
                </motion.figure>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  )
}
