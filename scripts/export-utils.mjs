import path from 'node:path'

export function parseRange(value, pages) {
  if (!value) return Array.from({ length: pages }, (_, index) => index + 1)
  const selected = new Set()
  for (const part of value.split(',')) {
    const match = part.trim().match(/^(\d+)(?:-(\d+))?$/)
    if (!match) throw new Error(`Invalid range: ${part}`)
    const start = Number(match[1])
    const end = Number(match[2] ?? match[1])
    if (start < 1 || end > pages || start > end)
      throw new Error(`Range ${part} is outside 1-${pages}`)
    for (let page = start; page <= end; page += 1) selected.add(page)
  }
  return [...selected].sort((a, b) => a - b)
}

export function parseFormats(value) {
  const allowed = new Set(['png', 'pdf', 'pptx', 'html'])
  const formats = (value ?? 'png,pdf,pptx')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
  for (const format of formats) {
    if (!allowed.has(format)) throw new Error(`Unknown format: ${format}`)
  }
  return [...new Set(formats)]
}

export function flagOf(args, name) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

export function hasFlag(args, name) {
  return args.includes(name)
}

export function pageFile(page) {
  return `page-${String(page).padStart(2, '0')}.png`
}

export function safeOutputDir(root, requested) {
  return path.resolve(root, requested ?? 'exports')
}

export function validateExportOptions({ allowTodo, allowWarnings, draft, formats, range }) {
  if (allowTodo && (!draft || formats.length !== 1 || formats[0] !== 'png'))
    throw new Error('--allow-todo is only available with --draft --format png')
  if (allowWarnings && !draft)
    throw new Error('--allow-warnings is only available with --draft')
  if (range && formats.includes('html'))
    throw new Error('--range cannot be combined with --format html because HTML contains the full deck')
}

export function validateTemplateSlides({ draft, slides }) {
  if (draft) return
  const templateSlides = slides
    .map((slide, index) => ({ ...slide, page: index + 1 }))
    .filter((slide) => slide.template)
  if (templateSlides.length)
    throw new Error(
      `Final export contains generated starter slides\n${templateSlides
        .map((slide) => `slide ${slide.page}: ${slide.title ?? slide.id}`)
        .join('\n')}`,
    )
}

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

export function contactSheetHtml({ title, images }) {
  const slides = images.map(({ page, file }) => `
    <figure>
      <img src="${escapeHtml(file)}" alt="Slide ${page}">
      <figcaption>${String(page).padStart(2, '0')}</figcaption>
    </figure>`).join('')
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} · Contact sheet</title>
  <style>
    :root { color-scheme: dark; font-family: system-ui, sans-serif; }
    body { margin: 0; background: #111; color: #ddd; }
    header { position: sticky; top: 0; z-index: 1; padding: 16px 24px; background: rgb(17 17 17 / 92%); border-bottom: 1px solid #333; backdrop-filter: blur(12px); }
    h1 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: 0; }
    main { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(440px, 100%), 1fr)); gap: 18px; padding: 18px; }
    figure { margin: 0; min-width: 0; }
    img { display: block; width: 100%; aspect-ratio: 16 / 9; object-fit: contain; background: #000; box-shadow: 0 12px 28px rgb(0 0 0 / 35%); }
    figcaption { padding-top: 7px; color: #999; font: 12px ui-monospace, monospace; }
  </style>
</head>
<body>
  <header><h1>${escapeHtml(title)} · ${images.length} slides</h1></header>
  <main>${slides}
  </main>
</body>
</html>
`
}
