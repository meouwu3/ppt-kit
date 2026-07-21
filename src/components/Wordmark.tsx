import type { CSSProperties } from 'react'

const strokes = [
  `M 12 62
   C 18 50, 26 30, 29 15
   C 29.8 11, 30.5 10.5, 30 14
   C 28 28, 26 48, 25.5 61
   C 25.4 64.5, 26.8 64.2, 28 61.5
   C 30.5 55, 34.5 48.5, 39.5 46.5
   C 43.5 45, 45.6 47.8, 45.2 52
   C 44.8 55.8, 44.4 58.5, 44.9 61
   C 45.4 63.8, 47 63.8, 48.5 61.5
   C 51 57.5, 54 52.5, 56 49.5
   C 57.8 46.8, 58.8 44.2, 56.6 43.4
   C 54 42.4, 51.5 45, 50.8 49
   C 50 53.5, 51.8 58, 55 59.5
   C 58 61, 61.5 59.5, 64 56.5
   C 66.3 53.8, 68.3 51.2, 69.5 50.2
   C 70.6 49.2, 71.1 50, 70.9 52
   C 70.6 55, 70.3 58.8, 71.8 60.8
   C 73.6 63.2, 76.5 60, 78 55.5
   C 78.6 53.6, 79.2 51.8, 79.5 50.6
   C 79.9 49, 80.6 49.2, 80.5 51
   C 80.2 57, 78.5 67.5, 74.5 74
   C 71.5 78.8, 67 78.5, 67.5 74.5
   C 68 70.5, 72.5 66, 78.5 62.2
   C 83 59.4, 87.5 56.8, 90.5 54
   C 91.7 52.9, 92.3 52.5, 92.2 54.2
   C 92 57, 92.6 60.8, 94.5 62.5
   C 96.6 64.3, 99 61.5, 100.3 57.5
   C 101.2 54.5, 102.3 54.3, 103 57
   C 103.8 60.2, 105.5 63.3, 107.8 62.8
   C 110.5 62.2, 113 57.5, 114.5 52.5
   C 115.3 50, 116.3 48.8, 117.5 48.2`,
  'M 123.5 60.5 C 123.8 60.2, 124.2 60.2, 124.5 60.5 C 124.8 60.9, 124.6 61.4, 124.1 61.4 C 123.6 61.4, 123.3 60.9, 123.5 60.5',
]

export function Wordmark({
  className,
  instant = false,
  loop = false,
  redraw = false,
}: {
  className?: string
  instant?: boolean
  loop?: boolean
  redraw?: boolean
}) {
  const classes = [
    'drawn-mark',
    instant && 'drawn-mark-instant',
    loop && 'drawn-mark-loop',
    redraw && 'drawn-mark-redraw',
    className,
  ].filter(Boolean).join(' ')
  return (
    <svg viewBox="6 4 124 82" role="img" aria-label="heyw" className={classes}>
      {strokes.map((path, index) => (
        <path
          key={index}
          d={path}
          pathLength={1}
          style={{ '--stroke-index': index } as CSSProperties}
        />
      ))}
    </svg>
  )
}
