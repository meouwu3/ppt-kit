# 组件参考

从 `src/deck` 导入运行时，从 `src/components` 导入视觉组件。本文件是目录，不是必用清单；只读取当前内容需要的章节。组件库是可复用骨架，题目需要时可以创建新的业务组件和视觉。

## 页面与步进

```tsx
import { Click, useClickSteps } from '../deck'
import { ContentSlide } from '../components'

export const meta = {
  id: 'stable-id',
  title: '导出耗时对比',
  section: '章节名',
  chrome: 'section',
}

export const notes = `讲稿、数据口径和来源。`

export default function Slide() {
  return (
    <ContentSlide title="导出耗时对比">
      <Click at={1}>第一步</Click>
      <Click at={2} effect="zoom">第二步</Click>
    </ContentSlide>
  )
}
```

- `CoverSlide`：基础封面；支持文字、背景和侧边 visual。视觉方向需要 full-bleed、舞台居中或其他构图时可自写封面
- `SectionSlide`：带巨大编号的章节配方，只在编号确实属于视觉语言时使用；其他章节页用 `CenterSlide` 或自定义布局
- `ContentSlide`：内容页，统一标题、发丝线和安全边距
- `CenterSlide`：居中陈述和结束页，可显式传 background
- `Click`：步进显现；不写 at 时按 DOM 顺序自动编号
- `useClickSteps(n)`：自定义动画先声明总步数
- `useClicks()`：读取 click、print 和 `isOn(at)`
- `PageNumber`、`SectionRange`、`PageChrome`：从 meta 自动计算，页面不要手写页码
- 标题由当前叙事决定；不为版式完整强行造金句，也不把所有标题限制成同一种句法

## 特殊组件的适用条件

使用特殊组件前，用一句话解释它如何服务当前页；说不清就换普通布局或新写题目专属画面。

| 组件/模式 | 适合 | 不适合 |
| --- | --- | --- |
| `BigNumber` | 一个数字值得被单独揭示、比较或记住 | 密集指标、坐标轴、装饰性数字 |
| `Compare` / `BeforeAfterStory` | 有真实可比口径或明确状态迁移 | 为制造戏剧性虚构旧方案或对手 |
| `MetricBarChart` | 少量分类值需要看差异 | 只有百分比、缺少可比较尺度或类别过多 |
| `BrowserFrame` | 产品界面、网页状态和可辨认截图 | 照片、插画或只是想给图片加一层框 |
| `Polaroid` | 个人照片、奖项、纸面实物与记忆感 | 数据截图、产品界面或正式合规材料 |
| `Character` / `SketchArrow` | 当前方向采用手绘场景，且人物动作/关系是信息 | 把人物当通用图标，或与品牌视觉冲突 |
| `InkPlum` | 用户明确选择墨纸意象，或个人叙事需要连续符号 | 通用封面装饰、采购/产品/培训的默认背景 |
| `SharedElement` | 同一对象跨页继续存在，运动能减少重新理解 | 只是文字相似，或动画比内容更抢眼 |
| `Conclusion` | 新增决定、行动或必要限定 | 重复标题、图表或正文已经说完的结论 |

## 数字与图表

```tsx
{/* 以下数值只演示 API，实际页面必须换成当前材料中的真实值 */}
<BigNumber value={72} unit="%" tone="good" at={1} />
<Num value={2400} at={2} className="text-accent" />
<Compare before={12} after={4} unit="步" at={3} />
<MetricBarChart data={[{ label: '旧流程', value: 12 }, { label: '新流程', value: 4, highlight: true }]} at={1} />
```

- `BigNumber`：主数字；使用数量由叙事决定，避免多个同权重巨型数字互相抵消
- `Num`：句内数字
- `Compare`：有真实绝对值的前后比较
- `MetricBarChart`：少量分类数据或时间点，标签写完整值
- `Todo`：未解决事实、来源、素材或内容决策的“待补信息”；必须传 `owner`，导出默认拒绝

逐页按叙事作用分类数字：被揭示、比较、变化或强调的量化结论使用 NumberFlow；表格、坐标轴、密集辅助值、日期、版本号、型号、ID、代码、页码和章节号保持静态并使用 tabular numerals。数字在 `<Click>` 内会继承父级步号，不在 `<Click>` 内时按需要显式传 `at`。

```tsx
<Todo owner="项目负责人">补最终发布日期与来源</Todo>
```

## 间距

- `--space-block`、`--space-card-padding-*` 与 `--space-chart-label` 是当前主题的默认尺度，可以由主题调整
- 带边框、阴影或底色的同级块不能视觉粘连，卡片组与警示/结论条之间要有清楚分组
- 图表数值不能压住柱、线或节点，分类标签不能与基线挤在一起
- 不用 `flex-1` 把少量内容拉成长空卡；卡片只用于真正并列、独立的项目

## 图解与人物

```tsx
<Character
  pose="design"
  label="设计"
  seed={7}
  bubble={{ children: '这个状态不对', at: 2, align: 'right' }}
/>
<Character kind="robot" pose="work" label="自动执行" tone="accent" seed={9} />
<SketchArrow at={2} label="提交" tone="accent" width={120} seed={11} />
<WarningStrip>信息经过多次转述</WarningStrip>
```

- `Character`：可选的手绘场景演员；person 或 robot，pose 为 stand、design、work、panic、cheer、shrug、dizzy、request
- `Character` 的 `bubble`：绑定人物头顶的台词，支持 at、align、delay；人物对话不要改用独立卡片
- `MiniCharacter`：22×32 的手绘人群单元；`PersonGlyph`：32×32 的头像式投入图标
- `SketchArrow`：right、left、up、down，支持 width、dashed、labelPosition、步进、语义 tone 与 seed
- `SpeechBubble`：只用于确实独立于人物的对话 UI；角色台词优先使用 `Character` 的 `bubble`
- `WarningStrip`：前后场景之间点破问题
- `ArchBox`：架构节点；`hand` 为种子化手绘框
- `SketchPipeline`：少量节点的一维流程

## 可选墨纸配方

```tsx
<CoverSlide
  background={<InkPlum seed={42} />}
  title="个人年度回顾"
/>
```

- `InkPlum`：墨梅 Canvas 算法，seed 必填；相同 seed 可以生成连续意象
- 墨梅不是默认封面装饰，只在本次设计声明明确采用该意象时使用
- InkPlum 会从当前主题读取 plum token，并在 print、概览和下一页预览中直接定格终态
- 个人叙事、签名、纸纹和手绘人物的组合方式见 [recipes-personal.md](recipes-personal.md)

## 跨页元素

页面序列里的同一标题、图片、产品对象或标识位置改变，且连续运动能增强理解时，使用 `SharedElement` 和 `SharedElementPlaceholder`；章节标题进入下一页同名标题栏时，可在两个 layout 中传入同一个 `sharedTitle`，并在 overlay 使用 `SharedTitleFlight`。`CrossPageElement` 是手写特殊轨迹的底层组件，`SignatureFlight` 是签名预制。完整契约和示例见 [overlays.md](overlays.md)。

## 证据与强调

```tsx
import screenshot from '../assets/product.png'

<BrowserFrame url="product.local">
  <img src={screenshot} alt="筛选后的订单趋势图" />
</BrowserFrame>
<Polaroid caption="现场照片" rotate={-2} tape>...</Polaroid>
<Mark at={3} type="circle">关键数字</Mark>
```

- `BrowserFrame`：产品截图和网页状态
- `Polaroid`：照片、奖状和纸面材料
- `Mark`：circle、underline、box、highlight；用于关键词、数字、收益和日期
- `ClaimEvidence`：事实或证明型页面的左侧立论、右侧支撑；表达页不必使用
- `Conclusion`：少量页面的可选收束；只有新增决策、行动或必要限定时使用，不是固定页脚
- `BeforeAfterStory`：之前、警示、现在三段式场景

## 选择规则

- 先按内容类型选组件，不为展示组件而选组件
- 同章可以复用模式建立稳定，也可以在有叙事理由时打破
- 专属业务画面可以新写 SVG 或 React 组件，但先查公共组件是否已覆盖骨架
- 不在一个页面堆叠多种装饰组件
- 小人、墨梅、纸纹、摄影、3D 和其他强风格组件服从本次设计声明
- 固定尺寸元素写明确宽高或 grid tracks，避免步进时布局跳动
