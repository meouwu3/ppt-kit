#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import JSZip from 'jszip'
import { PDFDocument } from 'pdf-lib'
import { chromium } from 'playwright'
import PptxGenJS from 'pptxgenjs'
import {
  flagOf,
  hasFlag,
  contactSheetHtml,
  pageFile,
  parseFormats,
  parseRange,
  safeOutputDir,
  validateExportOptions,
  validateTemplateSlides,
} from './export-utils.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const args = process.argv.slice(2)
const formats = parseFormats(flagOf(args, '--format'))
const draft = hasFlag(args, '--draft')
const scale = draft ? 1 : Number(flagOf(args, '--scale') ?? 2)
const workerCount = Math.max(1, Math.min(Number(flagOf(args, '--workers') ?? 4), 8))
const port = Number(flagOf(args, '--port') ?? 4310)
const outRoot = safeOutputDir(root, flagOf(args, '--out'))
const allowTodo = hasFlag(args, '--allow-todo')
const allowWarnings = hasFlag(args, '--allow-warnings')
const externalUrl = flagOf(args, '--url')
const startedAt = performance.now()

if (!Number.isFinite(scale) || scale <= 0) throw new Error('--scale must be a positive number')
validateExportOptions({
  allowTodo,
  allowWarnings,
  draft,
  formats,
  range: flagOf(args, '--range'),
})

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))

async function startServer() {
  if (externalUrl) return { base: externalUrl.replace(/\/$/, ''), server: null }
  const base = `http://127.0.0.1:${port}`
  const server = spawn(
    path.join(root, 'node_modules/.bin/vite'),
    ['--host', '127.0.0.1', '--port', String(port), '--strictPort'],
    { cwd: root, env: { ...process.env, VITE_EXPORT: '1' }, stdio: ['ignore', 'pipe', 'pipe'] },
  )
  let serverError = ''
  server.stderr.on('data', (chunk) => {
    serverError += String(chunk)
  })
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    try {
      const response = await fetch(base)
      if (response.ok) return { base, server }
    } catch {
      // The server is still starting.
    }
    if (server.exitCode != null) throw new Error(`Vite exited early\n${serverError}`)
    await sleep(100)
  }
  server.kill()
  throw new Error(`Vite did not start within 30s\n${serverError}`)
}

async function fixMediaNamesForQuickLook(file) {
  const zip = await JSZip.loadAsync(await readFile(file))
  const renames = []
  let index = 0
  for (const name of Object.keys(zip.files)) {
    const match = name.match(/^ppt\/media\/(image(?:-\d+)+)(\.\w+)$/)
    if (match) renames.push([match[1] + match[2], `image${++index}${match[2]}`])
  }
  if (renames.length === 0) return
  for (const [from, to] of renames) {
    const data = await zip.file(`ppt/media/${from}`).async('nodebuffer')
    zip.file(`ppt/media/${to}`, data)
    zip.remove(`ppt/media/${from}`)
  }
  for (const name of Object.keys(zip.files)) {
    if (!name.endsWith('.rels')) continue
    let xml = await zip.file(name).async('string')
    for (const [from, to] of renames) xml = xml.replaceAll(from, to)
    zip.file(name, xml)
  }
  await writeFile(
    file,
    await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
    }),
  )
}

async function createPdf(files, output) {
  const document = await PDFDocument.create()
  for (const file of files) {
    const image = await document.embedPng(await readFile(file))
    const page = document.addPage([1280, 720])
    page.drawImage(image, { x: 0, y: 0, width: 1280, height: 720 })
  }
  await writeFile(output, await document.save())
}

async function createPptx(files, selectedPages, manifest, output) {
  const pptx = new PptxGenJS()
  pptx.defineLayout({ name: 'PPT_WIDE', width: 13.333, height: 7.5 })
  pptx.layout = 'PPT_WIDE'
  pptx.author = manifest.author ?? ''
  pptx.company = ''
  pptx.subject = manifest.description ?? ''
  pptx.title = manifest.title
  pptx.lang = 'zh-CN'
  for (let index = 0; index < files.length; index += 1) {
    const slide = pptx.addSlide()
    slide.background = { color: 'F7F6F1' }
    slide.addImage({ path: files[index], x: 0, y: 0, w: 13.333, h: 7.5 })
    const note = manifest.slides[selectedPages[index] - 1]?.notes
    if (note) slide.addNotes(note)
  }
  await pptx.writeFile({ fileName: output })
  await fixMediaNamesForQuickLook(output)
}

async function buildPortableHtml(output) {
  await new Promise((resolve, reject) => {
    const build = spawn('pnpm', ['build'], { cwd: root, stdio: 'inherit' })
    build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pnpm build exited ${code}`))))
  })
  await rm(output, { recursive: true, force: true })
  await cp(path.join(root, 'dist'), output, { recursive: true })
}

const { base, server } = await startServer()
let browser

try {
  browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: scale,
  })
  const errors = []
  const createPage = async () => {
    const page = await context.newPage()
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console: ${message.text()}`)
    })
    page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
    page.on('response', (response) => {
      if (response.status() >= 400) errors.push(`HTTP ${response.status()}: ${response.url()}`)
    })
    await page.goto(`${base}/?print=1`, { waitUntil: 'load' })
    await page.waitForFunction(() => window.__PPT_EXPORT__?.manifest.pages, null, { timeout: 15_000 })
    return page
  }

  const first = await createPage()
  const manifest = await first.evaluate(() => window.__PPT_EXPORT__.manifest)
  validateTemplateSlides({ draft, slides: manifest.slides })
  const selectedPages = parseRange(flagOf(args, '--range'), manifest.pages)
  const outDir = path.join(outRoot, manifest.id)
  const pngDir = path.join(outDir, 'png')
  await mkdir(pngDir, { recursive: true })

  console.log(`Exporting "${manifest.title}" · ${selectedPages.length}/${manifest.pages} slides · ${scale}x`)
  const count = Math.min(workerCount, selectedPages.length)
  const pages = [first]
  for (let index = 1; index < count; index += 1) pages.push(await createPage())

  let cursor = 0
  const audits = []
  const files = new Map()
  let completed = 0
  await Promise.all(
    pages.map(async (browserPage) => {
      while (cursor < selectedPages.length) {
        const index = cursor++
        const slidePage = selectedPages[index]
        const audit = await browserPage.evaluate((target) => window.__PPT_EXPORT__.show(target), slidePage)
        audits.push(audit)
        const file = path.join(pngDir, pageFile(slidePage))
        await browserPage.locator('[data-slide-canvas]').screenshot({ path: file, animations: 'disabled' })
        files.set(slidePage, file)
        completed += 1
        console.log(`  ${completed}/${selectedPages.length} · slide ${slidePage}`)
      }
    }),
  )
  const contactSheetFile = path.join(outDir, 'contact-sheet.html')
  await writeFile(
    contactSheetFile,
    contactSheetHtml({
      title: manifest.title,
      images: selectedPages.map((slidePage) => ({
        page: slidePage,
        file: path.posix.join('png', pageFile(slidePage)),
      })),
    }),
  )
  if (errors.length) throw new Error(`Browser errors during export\n${[...new Set(errors)].join('\n')}`)
  const unresolvedTodos = audits.flatMap((audit) =>
    audit.todos.map((todo) => `slide ${audit.page}: ${todo}`),
  )
  if (!allowTodo && unresolvedTodos.length)
    throw new Error(`Export blocked by unresolved Todo placeholders\n${unresolvedTodos.join('\n')}`)
  const visualWarnings = audits.flatMap((audit) => [
    ...audit.overflows.map((item) => `slide ${audit.page} overflow: ${item}`),
    ...audit.imagesWithoutAlt.map((item) => `slide ${audit.page} missing alt: ${item}`),
  ])
  if (!allowWarnings && visualWarnings.length)
    throw new Error(`Slides failed visual audit\n${visualWarnings.join('\n')}`)

  const orderedFiles = selectedPages.map((slidePage) => files.get(slidePage))
  const artifacts = []
  if (formats.includes('pdf')) {
    const output = path.join(outDir, `${manifest.id}.pdf`)
    await createPdf(orderedFiles, output)
    artifacts.push(output)
  }
  if (formats.includes('pptx')) {
    const output = path.join(outDir, `${manifest.id}.pptx`)
    await createPptx(orderedFiles, selectedPages, manifest, output)
    artifacts.push(output)
  }
  if (formats.includes('html')) {
    const output = path.join(outDir, 'html')
    await buildPortableHtml(output)
    artifacts.push(output)
  }

  const images = []
  for (const slidePage of selectedPages) {
    const file = files.get(slidePage)
    const bytes = await readFile(file)
    images.push({
      page: slidePage,
      file: path.relative(outDir, file),
      sha256: createHash('sha256').update(bytes).digest('hex'),
    })
  }
  const artifactManifest = {
    ...manifest,
    exportedAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - startedAt),
    scale,
    selectedPages,
    images,
    audits: audits.sort((a, b) => a.page - b.page),
  }
  const manifestFile = path.join(outDir, 'manifest.json')
  await writeFile(manifestFile, `${JSON.stringify(artifactManifest, null, 2)}\n`)
  artifacts.unshift(pngDir, manifestFile, contactSheetFile)

  console.log(`Done in ${(artifactManifest.durationMs / 1000).toFixed(2)}s`)
  for (const artifact of artifacts) console.log(`  ${artifact}`)
} finally {
  await browser?.close()
  server?.kill()
}
