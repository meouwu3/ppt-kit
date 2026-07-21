import { execFile } from 'node:child_process'
import { access, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { promisify } from 'node:util'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { copyTemplate } from '../skills/ppt/scripts/copy-template.mjs'

const execFileAsync = promisify(execFile)
const root = fileURLToPath(new URL('..', import.meta.url))

async function isMissing(file: string) {
  try {
    await access(file)
    return false
  } catch {
    return true
  }
}

describe('skill template copy', () => {
  it('copies only source entries and excludes installed dependencies and build output', async () => {
    const fixture = await mkdtemp(path.join(tmpdir(), 'ppt-template-copy-'))
    const output = path.join(fixture, 'output')
    await mkdir(output)

    for (const entry of [
      '.gitignore',
      '.oxlintrc.json',
      'index.html',
      'package.json',
      'pnpm-lock.yaml',
      'tsconfig.app.json',
      'tsconfig.json',
      'tsconfig.node.json',
      'vite.config.ts',
    ]) await writeFile(path.join(fixture, entry), `${entry}\n`)
    for (const entry of ['scripts', 'src', 'tests', 'node_modules', 'dist']) {
      await mkdir(path.join(fixture, entry))
      await writeFile(path.join(fixture, entry, 'sentinel.txt'), entry)
    }

    await copyTemplate(fixture, output)

    expect(await readFile(path.join(output, 'src', 'sentinel.txt'), 'utf8')).toBe('src')
    expect(await isMissing(path.join(output, 'node_modules'))).toBe(true)
    expect(await isMissing(path.join(output, 'dist'))).toBe(true)
    await rm(fixture, { recursive: true, force: true })
  })

  it('generates a clean cross-agent project from the bundled template', async () => {
    const output = await mkdtemp(path.join(tmpdir(), 'ppt-generated-'))
    await execFileAsync(process.execPath, [
      path.join(root, 'skills/ppt/scripts/create-ppt.mjs'),
      '--title',
      '生成器验证',
      '--output',
      output,
      '--force',
      '--no-install',
    ], { cwd: root })

    expect(await readFile(path.join(output, 'CLAUDE.md'), 'utf8')).toBe('@AGENTS.md\n')
    expect(await readFile(path.join(output, 'brief.md'), 'utf8')).toContain('AI 可自主决定的范围')
    expect(await readFile(path.join(output, 'design-spec.md'), 'utf8')).toContain('视觉意图')
    expect(await readFile(path.join(output, 'docs/design-process.md'), 'utf8')).toContain('本次设计声明')
    expect(await readFile(path.join(output, 'docs/evaluation.md'), 'utf8')).toContain('交付闸门')
    expect(await readFile(path.join(output, 'docs/archetypes.md'), 'utf8')).toContain('任务模式与 Brief')
    expect(await readFile(path.join(output, 'docs/visual-quality.md'), 'utf8')).toContain('视觉工艺检查')
    expect(await readFile(path.join(output, 'src/deck.config.ts'), 'utf8')).toContain('theme: "studio"')
    expect(await readFile(path.join(output, 'src/deck/overlays.tsx'), 'utf8')).toContain('font-display')
    expect(await readFile(path.join(output, 'vite.config.ts'), 'utf8')).toContain("dedupe: ['react', 'react-dom']")
    expect(await readFile(path.join(output, 'src/slides/01-cover.tsx'), 'utf8')).toContain('template: true')
    expect(await isMissing(path.join(output, 'node_modules'))).toBe(true)
    expect(await isMissing(path.join(output, 'dist'))).toBe(true)
    await rm(output, { recursive: true, force: true })
  })
})
