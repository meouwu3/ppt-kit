# PPT Kit

一套由 AI 创作、网页放映、整图交付的 PPT 系统。仓库根目录是可运行的 Vite 模板，`skills/ppt` 是可通过 skills.sh 单独安装的自包含 skill。每次任务都会生成一个独立项目，不积累演讲列表，也不包含登录或口令。

根目录演示中的 `heyw` 签名只用于展示 `SignatureFlight` 的跨页运动效果。发布用 skill 和新生成项目不包含该签名字形；只有用户提供签名或品牌标识时才会启用这类效果。

## 通过 skills.sh 安装

仓库上传到 GitHub 后，可安装到 Codex：

```bash
npx skills add eggx8/ppt-kit --skill ppt -g -a codex -y
```

Codex 当前显式调用 skill 的写法是：

```text
$ppt 做一套关于……的 PPT
```

直接描述“把这些材料做成晋升答辩”也可以触发。`/ppt` 不是 skills.sh 或 Codex skill 的调用语法。

## 本地开发

```bash
pnpm install
pnpm dev
pnpm check
pnpm export
```

默认预览地址是 `http://127.0.0.1:4173`。导出产物写入 `exports/<deck-id>/`，包含逐页 PNG、PDF、PPTX 和审计清单。

## 创作模型

- `src/slides/*.tsx`：一页一个文件，文件名自然排序
- `src/deck.config.ts`：当前 PPT 的元数据、主题和页面集合
- `src/deck/`：固定画布、步进、概览、演讲者模式、共享元素转场、页码和导出协议
- `src/components/`：版式、数字、图表、证据、手绘人物、墨梅和叙事模式
- `src/styles/tokens.css`：主题语义 token
- `scripts/export.mjs`：一次加载、并发截图、PNG/PDF/PPTX/HTML 导出
- `skills/ppt/`：创作流程、参考资料、项目生成器和内置模板

完整的设计流程、写作、组件、主题、评估和导出说明在 [PPT skill](./skills/ppt/SKILL.md) 及其 `references/` 中。新任务先建立 brief 和本次设计声明；高关注或方向不明确的演示会先探索不同的信息架构与视觉概念，再制作完整页序。中文文案的语气校准见 [voice.md](./skills/ppt/references/voice.md)，运行时设计见 [architecture.md](./docs/architecture.md)。

任务模式是创作起点而不是固定模板，可以在不同章节组合。晋升答辩中的墨梅、签名、纸张、衬线和手绘人物被保留为可选配方；事实诚信、稳定运行时和可验证交付才是全局硬约束。

每个生成项目同时包含 `AGENTS.md` 和引用它的 `CLAUDE.md`，Codex 与 Claude Code 会读取同一套项目规则。

## 维护 skill 模板

根目录是模板源码。修改运行时、组件或导出器后执行：

```bash
pnpm sync-skill
```

它会刷新 `skills/ppt/assets/template`。安装后的 skill 只依赖自身目录，不读取仓库父目录。不要在模板副本内安装依赖或构建；生成器使用白名单复制，并在正式导出时阻止未替换的 starter 页。

## 设计边界

项目保留固定 1280x720 画布和整图交付，不追求页面内容在手机上重排。播放器控制、概览和演讲者模式会适应窗口，幻灯片本身始终与 PPTX 最终画面一致。
