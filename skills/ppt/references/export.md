# 预览、校验与导出

## 预览

```bash
pnpm dev
```

服务只绑定 `127.0.0.1`。常用键位：方向键或空格步进，`o` 或 `g` 概览，数字加回车跳页，`f` 全屏，`p` 演讲者模式。

## 校验

```bash
pnpm check
```

导出器自动检查：

- `<Todo owner="...">` 是否清零
- 是否仍有 `meta.template: true` 的生成器 starter 页
- 标记为受约束的文字是否溢出，文字是否跑出画布
- 信息图片是否缺少 `alt`
- 控制台错误、未捕获异常和失败资源
- 字体、图片与两帧布局是否就绪

浏览器逐步预览和 contact sheet 人工检查：

- NumberFlow 是否在对应步进播放，而不是在隐藏状态提前播完
- 带边框块、警示条和图表标签是否保持 [visual-quality.md](visual-quality.md) 规定的间距

`Todo` 表示仍缺事实、来源、素材或内容决策，不是渲染错误。草稿需要保留 Todo 时只运行：

```bash
pnpm export --draft --format png --allow-todo
```

`--allow-todo` 只能与草稿 PNG 同用。向用户交草稿时按页列出每个 Todo、确认人或来源以及补齐方式；正式 PDF、PPTX 和 HTML 必须 `Todo: 0`。`meta.template: true` 只允许方向稿和草稿，正式导出会直接阻断。`--allow-warnings` 只用于草稿诊断，不用于正式交付。

## 导出

```bash
pnpm export
pnpm export --draft --format png
pnpm export --format png,pdf,pptx,html --out ./exports
pnpm export --range 3-8 --workers 4 --scale 2
```

默认输出 PNG、PDF 和 PPTX 到 `exports/<deck-id>/`。PPTX 每页是一张 16:9 整图，并写入页面的 speaker notes。`manifest.json` 记录页序、审计结果、尺寸、耗时和每张 PNG 的 SHA-256；`contact-sheet.html` 汇总当前导出页，用于整套截图评审。

参数：

- `--format`：png、pdf、pptx、html 的逗号列表
- `--out`：产物根目录
- `--range`：如 `1-5,8,10-12`
- `--workers`：并发页面数，默认 4，最大 8
- `--scale`：截图倍率，默认 2
- `--draft`：等价于 1 倍快速截图
- `--url`：复用已经启动的预览服务
- `--port`：自起服务端口

`--range` 只适用于 PNG、PDF 和 PPTX；HTML 始终包含整套演示，不能与 `--range` 同用。

## 性能协议

导出器不等待 `networkidle`，也不使用固定 sleep。每个 Playwright 页面只加载一次，通过 `window.__PPT_EXPORT__.show(page)` 页内切换，等待字体、图片和两帧布局后截图。不要在组件里加入无法注册的任意延迟。

## 交付检查

- 打开 `contact-sheet.html` 或概览逐页扫一遍
- 按 [evaluation.md](evaluation.md) 检查注意力、节奏、重复模板、密度突变、视觉概念和素材一致性
- 核对封面标题、页数、章节范围和结束页
- 抽查 PNG 为 2560x1440（2 倍）
- 打开 PPTX，确认页数与 notes
- 在 macOS Quick Look 和目标 Office 软件各抽查一次
- 内部材料默认留在本地，不上传公共 URL
- 最终回复明确写出 `Todo: 0` 和模板页 0；若仍有 Todo 或 starter，只能交草稿预览和逐页待补清单，不能称为最终交付
