import { useLayoutEffect, useRef, useState } from 'react'
import { useDeckPage } from '../deck/DeckContext'
import { mulberry32 } from '../deck/rough'

const R15 = Math.PI / 12
const MIN_BRANCH = 30
const SEGMENT_LENGTH = 6
const FRAME_INTERVAL = 1000 / 40
const MAX_SEGMENTS = 40000
const MIN_DRAWN_PER_TREE = 300
const MASK = 'radial-gradient(circle, transparent 30%, black 80%)'

const token = (style: CSSStyleDeclaration, name: string, fallback: string) =>
  style.getPropertyValue(name).trim() || fallback

const tokenNumber = (style: CSSStyleDeclaration, name: string, fallback: number) => {
  const value = Number(style.getPropertyValue(name))
  return Number.isFinite(value) ? value : fallback
}

export function InkPlum({
  seed,
  instant,
  className = 'pointer-events-none absolute inset-0 h-full w-full',
}: {
  seed: number
  instant?: boolean
  className?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const { print } = useDeckPage()
  const drawInstantly = instant ?? print

  useLayoutEffect(() => {
    const canvas = ref.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let animationFrame = 0
    let width = 0
    let height = 0
    let disposed = false

    const markReady = () => {
      if (!disposed) setReady(true)
    }

    function paint(attempt = 0) {
      cancelAnimationFrame(animationFrame)
      setReady(false)
      const random = mulberry32(seed + attempt * 1013)
      width = canvas!.clientWidth
      height = canvas!.clientHeight
      if (!width || !height) return

      const dpr = window.devicePixelRatio || 1
      canvas!.width = Math.round(width * dpr)
      canvas!.height = Math.round(height * dpr)
      context!.setTransform(dpr, 0, 0, dpr, 0, 0)
      context!.clearRect(0, 0, width, height)
      context!.lineCap = 'round'

      const style = getComputedStyle(canvas!)
      const ink = token(style, '--plum-ink', '#88867c')
      const accent = token(style, '--plum-accent', '#67819d')
      const branchOpacity = tokenNumber(style, '--plum-branch-opacity', 0.13)
      const blossomOpacity = tokenNumber(style, '--plum-blossom-opacity', 0.24)
      const accentOpacity = tokenNumber(style, '--plum-accent-opacity', 0.38)
      context!.strokeStyle = ink

      let steps: Array<() => void> = []
      let previousSteps: Array<() => void> = []
      let drawn = 0

      function blossom(x: number, y: number) {
        const useAccent = random() < 0.12
        const petals = 2 + Math.floor(random() * 2)
        context!.fillStyle = useAccent ? accent : ink
        context!.globalAlpha = useAccent ? accentOpacity : blossomOpacity
        for (let index = 0; index < petals; index += 1) {
          const angle = random() * Math.PI * 2
          const distance = random() * 3
          const radius = 0.7 + random() * 0.9
          context!.beginPath()
          context!.arc(
            x + Math.cos(angle) * distance,
            y + Math.sin(angle) * distance,
            radius,
            0,
            Math.PI * 2,
          )
          context!.fill()
        }
        context!.globalAlpha = branchOpacity
      }

      function step(
        x: number,
        y: number,
        angle: number,
        counter: { value: number },
      ) {
        if (drawn++ > MAX_SEGMENTS) return
        const length = random() * SEGMENT_LENGTH
        counter.value += 1
        const nextX = x + Math.cos(angle) * length
        const nextY = y + Math.sin(angle) * length
        context!.lineWidth = Math.max(0.5, 1.4 - counter.value * 0.012)
        context!.globalAlpha = branchOpacity
        context!.beginPath()
        context!.moveTo(x, y)
        context!.lineTo(nextX, nextY)
        context!.stroke()
        if (nextX < -100 || nextX > width + 100 || nextY < -100 || nextY > height + 100)
          return
        const branchRate = counter.value <= MIN_BRANCH ? 0.8 : 0.5
        let children = 0
        if (random() < branchRate) {
          children += 1
          steps.push(() => step(nextX, nextY, angle + random() * R15, counter))
        }
        if (random() < branchRate) {
          children += 1
          steps.push(() => step(nextX, nextY, angle - random() * R15, counter))
        }
        if (children === 0 && counter.value > MIN_BRANCH && random() < 0.12)
          blossom(nextX, nextY)
      }

      const randomMiddle = () => random() * 0.6 + 0.2
      steps = [
        () => step(randomMiddle() * width, -5, Math.PI / 2, { value: 0 }),
        () => step(randomMiddle() * width, height + 5, -Math.PI / 2, { value: 0 }),
        () => step(-5, randomMiddle() * height, 0, { value: 0 }),
        () => step(width + 5, randomMiddle() * height, Math.PI, { value: 0 }),
      ]
      if (width < 640) steps = steps.slice(0, 2)
      const minimumDrawn = steps.length * MIN_DRAWN_PER_TREE

      const retryOrFinish = () => {
        context!.globalAlpha = 1
        if (drawn < minimumDrawn && attempt < 4) paint(attempt + 1)
        else markReady()
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (drawInstantly || reducedMotion) {
        while (steps.length > 0 && drawn <= MAX_SEGMENTS) {
          previousSteps = steps
          steps = []
          previousSteps.forEach((draw) => draw())
        }
        retryOrFinish()
        return
      }

      let lastTime = 0
      function frame(now: number) {
        if (now - lastTime >= FRAME_INTERVAL) {
          lastTime = now
          previousSteps = steps
          steps = []
          if (previousSteps.length === 0) {
            retryOrFinish()
            return
          }
          previousSteps.forEach((draw) => {
            if (random() < 0.5) steps.push(draw)
            else draw()
          })
        }
        animationFrame = requestAnimationFrame(frame)
      }
      animationFrame = requestAnimationFrame(frame)
    }

    paint()
    const resizeObserver = new ResizeObserver(() => {
      if (
        Math.abs(canvas.clientWidth - width) > 64 ||
        Math.abs(canvas.clientHeight - height) > 160
      )
        paint()
    })
    resizeObserver.observe(canvas)
    const themeObserver = new MutationObserver(() => paint())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => {
      disposed = true
      cancelAnimationFrame(animationFrame)
      resizeObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [drawInstantly, seed])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      data-export-ready={ready ? '1' : '0'}
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      className={className}
    />
  )
}
