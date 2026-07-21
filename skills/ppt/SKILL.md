---
name: ppt
description: Create, redesign, critique, preview, and export original presentations as standalone Vite and React projects with PNG, PDF, PPTX, and HTML output. Use when the user asks for PPT, PPTX, slides, presentation, deck, 演示文稿, 汇报, 答辩, 路演, 培训课件, or wants source material turned into a visual presentation.
---

# PPT

把每次任务做成一个独立 Vite 项目：一页一个 TSX 文件，网页放映，最终帧整图导出。组件库提供质量下限，不限定视觉上限；内容、结构、视觉和题目专属画面必须为当前任务重新创作。

## 自由度边界

以下是不随风格变化的硬约束：

- 不编造真实世界的数字、人物、客户、案例、引语、评价、品牌事实或来源
- 不改 `src/deck/**`、导出器和基础运行时，除非任务本身就是修运行时；创作区是 `src/slides/`、`src/assets/`、主题 token 和题目专属组件
- 保留 1280×720 逻辑画布、稳定 `meta.id`、确定性 print 终态、本地资源和可重复导出
- 正式交付无模板页、无 Todo、无越界、无资源错误；交互页的最终静态帧也必须成立
- 不把 starter 的顺序、文案、示例数据、签名或视觉主题换皮后交付

以下由材料、受众和设计方向决定，不是全局禁令或配额：版式、字体角色、色彩、页面密度、是否使用大数字、手绘人物、墨梅、摄影、卡片、章节页、共享元素和动效数量。用户提供的品牌与参考风格优先于默认建议。

## 工作流

1. 把包含本文件的目录记为 `SKILL_DIR`
2. 新建或整体重做演示时，阅读 [references/design-process.md](references/design-process.md)，从用户材料建立 brief，区分事实、观点、建议、假设和示例
3. 只有会改变决策口径、事实真实性、合规、身份或高成本视觉方向的未知项才阻塞；一次最多问三个问题。低风险未知项写入 brief 的假设区后继续做草稿
4. 需要选择叙事任务时阅读 [references/archetypes.md](references/archetypes.md)。类型是可组合的思考起点，不是固定模板
5. 高关注、品牌敏感或视觉方向未定义时，先探索 2–3 个真正不同的视觉/信息架构方向；普通任务可以内部比较后直接选择，并记录选择理由
6. brief 和方向足够后运行 `node "$SKILL_DIR/scripts/create-ppt.mjs" --title "<标题>"`；默认在系统临时目录创建项目并安装依赖，指定目录时传 `--output`
7. 写页面提纲：`目的 | 内容性质或支撑 | 构图 | 步进/状态变化 | 共享元素候选`。支撑可以是数据、来源、逻辑、演示、示例、建议或无；不要强迫每页都成为证据页
8. 写文案时按需阅读 [references/writing.md](references/writing.md)；需要语言审校时阅读 [references/voice.md](references/voice.md)
9. 选主题或品牌视觉时阅读 [references/themes.md](references/themes.md)；从 [references/components.md](references/components.md) 只读取当前要用的组件章节。没有合适组件时创建题目专属 React、SVG、Canvas 或 Three.js 画面
10. 同一对象跨页运动确实能增强连续理解时阅读 [references/overlays.md](references/overlays.md)。不要为了展示能力让所有元素飞行
11. 启动本地预览，按 [references/evaluation.md](references/evaluation.md) 收集浏览器、点击、截图和 contact sheet 证据；把问题退回 brief、结构、组件、主题或工艺对应阶段，不在整套页面上盲目打补丁
12. 用户确认内容且正式交付条件满足后，阅读 [references/export.md](references/export.md)，运行 `pnpm check` 和 `pnpm export`

## 内容真实性

- 用户材料中的事实可以直接使用，并在 notes 记录来源文件或“用户提供”
- 可外部核验的事实与量化主张需要来源、用户确认或 `<Todo owner="确认人或来源">`
- 提案、目标、设计概念和推演不需要伪装成既成事实；明确写成“建议”“目标”“假设”或场景测算即可
- 教学示例、虚构情境和概念演示可以创作，但不能让观众误以为是真实客户、真实业绩或真实引语
- 草稿可以保留 Todo，并逐项向用户解释；正式 PDF、PPTX 和 HTML 必须 Todo 为 0

## 创作原则

- 先决定观众应该注意什么，再选择构图；特殊组件只有能解释其叙事作用时才使用
- 像设计网页 section 一样处理画面：允许 full-bleed、split、层叠、非对称和大面积留白，不默认退化为等大卡片墙
- 组件库是地板，不是天花板。鼓励为题目发明新的图解、场景、产品画面和视觉隐喻
- 动效用于揭示关系、变化、因果或连续对象；尊重 reduced motion，并为 print 提供清楚终态
- 禁止自动生成无来源的英文眉题、翻译、全大写标签和口号；用户或品牌真实提供的英文、会议名和系列名可以使用
- 晋升答辩的墨梅、签名、纸张、衬线与手绘人物只在方向匹配时启用，见 [references/recipes-personal.md](references/recipes-personal.md)

## 完成条件

- 演示是为当前任务重新创作的，不是 starter 换皮
- 叙事、构图和视觉语言适合当前听众，不被某一种历史模板绑架
- 步进可前进和回退，共享元素、概览、演讲者模式和 print 终态正常
- 浏览器事实检查、截图视觉评审、contact sheet 节奏检查、构建与正式导出都通过
- 交付预览地址、源码与产物目录，并报告剩余假设；正式交付明确报告 `Todo: 0`
