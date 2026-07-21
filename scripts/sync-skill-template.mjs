#!/usr/bin/env node
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const target = path.join(root, 'skills', 'ppt', 'assets', 'template')
const entries = [
  '.gitignore',
  '.oxlintrc.json',
  'index.html',
  'package.json',
  'pnpm-lock.yaml',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
  'scripts',
  'src',
  'tests',
]

await rm(target, { recursive: true, force: true })
await mkdir(target, { recursive: true })

for (const entry of entries)
  await cp(path.join(root, entry), path.join(target, entry), { recursive: true })

await rm(path.join(target, 'scripts', 'sync-skill-template.mjs'))
await rm(path.join(target, 'tests', 'create-ppt.test.ts'), { force: true })
await rm(path.join(target, 'src', 'components', 'Wordmark.tsx'))
await rm(path.join(target, 'src', 'slides', '00-signature.tsx'))

const componentsIndexFile = path.join(target, 'src', 'components', 'index.ts')
const componentsIndex = (await readFile(componentsIndexFile, 'utf8'))
  .replace("export * from './Wordmark'\n", '')
await writeFile(componentsIndexFile, componentsIndex)

await writeFile(
  path.join(target, 'src', 'overlay.tsx'),
  `import { SharedTitleFlight } from './deck'\nimport type { DeckOverlayProps } from './deck'\n\nexport function DemoOverlay({ page, print }: DeckOverlayProps) {\n  return (\n    <SharedTitleFlight\n      name="evidence-title"\n      page={page}\n      print={print}\n      sectionId="evidence-section"\n      contentId="evidence"\n    />\n  )\n}\n`,
)

const packageFile = path.join(target, 'package.json')
const packageJson = JSON.parse(await readFile(packageFile, 'utf8'))
delete packageJson.scripts['create-ppt']
delete packageJson.scripts['sync-skill']
await writeFile(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`)

console.log(`Skill template refreshed at ${target}`)
