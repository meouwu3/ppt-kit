import { cp } from 'node:fs/promises'
import path from 'node:path'

export const TEMPLATE_ENTRIES = [
  '.gitignore',
  '.oxlintrc.json',
  'index.html',
  'package.json',
  'pnpm-lock.yaml',
  'scripts',
  'src',
  'tests',
  'tsconfig.app.json',
  'tsconfig.json',
  'tsconfig.node.json',
  'vite.config.ts',
]

export async function copyTemplate(templateRoot, output) {
  for (const entry of TEMPLATE_ENTRIES)
    await cp(path.join(templateRoot, entry), path.join(output, entry), { recursive: true })
}
