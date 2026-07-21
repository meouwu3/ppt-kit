#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { access, cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { copyTemplate } from './copy-template.mjs'

const skillRoot = fileURLToPath(new URL('..', import.meta.url))
const templateRoot = path.join(skillRoot, 'assets', 'template')
const args = process.argv.slice(2)
const valueOf = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}
const title = valueOf('--title') ?? '未命名演示'
const theme = valueOf('--theme') ?? 'studio'
const date = valueOf('--date')
const force = args.includes('--force')
const install = !args.includes('--no-install')
const slug = (valueOf('--id') ?? title)
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || 'deck'

let output = valueOf('--output')
if (output) {
  output = path.resolve(output)
  let exists = false
  try {
    await access(output)
    exists = true
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  const outputIsEmpty = exists && (await readdir(output)).length === 0
  if (exists && !outputIsEmpty && !force)
    throw new Error(`Output already exists: ${output}. Pass --force to replace it.`)
  if (exists && !outputIsEmpty) await rm(output, { recursive: true, force: true })
  await mkdir(output, { recursive: true })
} else {
  output = await mkdtemp(path.join(tmpdir(), `ppt-${slug}-`))
}

await copyTemplate(templateRoot, output)

const packageFile = path.join(output, 'package.json')
const packageJson = JSON.parse(await readFile(packageFile, 'utf8'))
packageJson.name = slug
packageJson.description = title
delete packageJson.scripts['create-ppt']
delete packageJson.scripts['sync-skill']
await writeFile(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`)

const slidesDir = path.join(output, 'src', 'slides')
for (const file of await readdir(slidesDir)) await rm(path.join(slidesDir, file), { recursive: true, force: true })
await rm(path.join(output, 'src', 'assets'), { recursive: true, force: true })
await mkdir(path.join(output, 'src', 'assets'), { recursive: true })
await rm(path.join(output, 'src', 'overlay.tsx'), { force: true })

const docsDir = path.join(output, 'docs')
await mkdir(docsDir, { recursive: true })
for (const file of ['design-process.md', 'archetypes.md', 'writing.md', 'voice.md', 'components.md', 'overlays.md', 'themes.md', 'recipes-personal.md', 'visual-quality.md', 'evaluation.md', 'export.md'])
  await cp(path.join(skillRoot, 'references', file), path.join(docsDir, file))

const dateLine = date ? `  date: ${JSON.stringify(date)},\n` : ''
await writeFile(
  path.join(output, 'src', 'deck.config.ts'),
  `import { defineDeck, defineSlides } from './deck'\n\nexport const deck = defineDeck({\n  id: '${slug}',\n  title: ${JSON.stringify(title)},\n${dateLine}  theme: ${JSON.stringify(theme)},\n  slides: defineSlides(import.meta.glob('./slides/*.tsx', { eager: true })),\n})\n`,
)

await writeFile(
  path.join(slidesDir, '01-cover.tsx'),
  `import { CoverSlide } from '../components'\nimport type { SlideMeta } from '../deck'\n\nexport const meta: SlideMeta = { id: 'cover', title: ${JSON.stringify(title)}, section: '开场', chrome: 'none', template: true }\nexport const notes = 'Starter page: replace this slide with content authored from the deck brief.'\n\nexport default function Slide() {\n  return <CoverSlide title=${JSON.stringify(title)} />\n}\n`,
)
await writeFile(
  path.join(slidesDir, '02-section.tsx'),
  `import { SectionSlide } from '../components'\nimport type { SlideMeta } from '../deck'\n\nexport const meta: SlideMeta = { id: 'section-one', title: '核心内容', section: '核心内容', chrome: 'none', template: true }\nexport const notes = 'Starter page: delete it if the chosen narrative has no chapter divider.'\n\nexport default function Slide() {\n  return <SectionSlide index="01" title="核心内容" />\n}\n`,
)
await writeFile(
  path.join(slidesDir, '03-end.tsx'),
  `import { CenterSlide } from '../components'\nimport type { SlideMeta } from '../deck'\n\nexport const meta: SlideMeta = { id: 'end', title: '结束', section: '收尾', chrome: 'none', template: true }\nexport const notes = 'Starter page: replace or remove it according to the audience task.'\n\nexport default function Slide() {\n  return <CenterSlide><h2 className="font-display text-6xl font-semibold text-ink">谢谢</h2></CenterSlide>\n}\n`,
)

await writeFile(
  path.join(output, 'brief.md'),
  `# Deck brief\n\n- 听众与场合：\n- 期望理解、决定或行动：\n- 时长与页数倾向：\n- 必须使用的材料：\n- 保密与来源边界：\n- 事实：\n- 观点、建议、假设与示例：\n- AI 可自主决定的范围：\n`,
)

await writeFile(
  path.join(output, 'design-spec.md'),
  `# Design spec\n\n- 任务模式与叙事主线：\n- 内容可信模式：\n- 视觉意图：\n- 核心视觉概念或媒介：\n- 信息密度与构图语法：\n- 字体角色与色彩逻辑：\n- 图像与素材家族：\n- 动效原则：\n- 明确避免：\n- 方向选择理由：\n`,
)

await writeFile(
  path.join(output, 'README.md'),
  `# ${title}\n\n独立的 Vite 幻灯片项目。先完成 \`brief.md\` 和 \`design-spec.md\`，再删除 starter slides 并从当前任务重新创作。\n\n\`\`\`bash\npnpm dev\npnpm check\npnpm export\n\`\`\`\n\n页面位于 \`src/slides/\`，主题位于 \`src/styles/tokens.css\`，创作和导出规则位于 \`docs/\`。\n`,
)
const projectInstructions = `# PPT project\n\n- Read \`docs/design-process.md\`, then complete \`brief.md\` and \`design-spec.md\` before authoring the full deck\n- Ask only consequential questions; continue low-risk drafts with explicit assumptions\n- Treat facts, opinions, recommendations, hypotheses, examples, and metaphors as different content types\n- Do not invent real-world facts, metrics, people, clients, quotes, results, brand details, or sources\n- Do not edit \`src/deck/**\` or export infrastructure unless the task explicitly concerns runtime behavior\n- Delete every slide whose meta contains \`template: true\`; author fresh slides in \`src/slides/\` and topic-specific components/assets\n- Treat task modes, components, themes, NumberFlow, shared elements, characters, plum, cards, and serif typography as contextual choices, not universal requirements\n- Components are a floor, not a ceiling; create topic-specific React, SVG, Canvas, or Three.js visuals when useful\n- Read only the relevant reference sections under \`docs/\`; use \`docs/evaluation.md\` for QA and \`docs/export.md\` for delivery\n- Use \`<Todo owner="...">\` for unresolved final facts or decisions; explain draft Todo items and clear them before final export\n- Preserve the 1280x720 canvas, semantic tokens, stable \`meta.id\`, reduced-motion behavior, and deterministic print state\n- Run browser click/screenshot/contact-sheet review, then \`pnpm check\` and \`pnpm export\` before final delivery\n`

await writeFile(path.join(output, 'AGENTS.md'), projectInstructions)
await writeFile(path.join(output, 'CLAUDE.md'), '@AGENTS.md\n')

if (install) {
  await new Promise((resolve, reject) => {
    const child = spawn('pnpm', ['install', '--frozen-lockfile'], { cwd: output, stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`pnpm install exited ${code}`))))
  })
}

console.log(JSON.stringify({ output, title, id: slug, installed: install }, null, 2))
