# 跨页共享元素

这里实现的是共享元素转场，不是浏览器 View Transitions API。真实元素常驻在固定 1280×720 画布中，位于页级 `AnimatePresence` 外，只随 page 更新目标位置。

## 何时使用

写完页面提纲后检查整个页面序列：

- 标题文字和语义完全相同，只是从章节中央移到下一页标题栏时，使用 `SharedTitleFlight`
- 同一张图片、同一个产品对象、标识、人物或流程节点继续出现，且连续运动能帮助观众保持对象身份时，考虑 `SharedElement`
- 同一对象连续跨过多页时，为每一页配置 frame，让它持续移动；中间页没有该对象时可以不配置，组件会隐藏
- 文案、时间点、状态或语义身份已经改变时，渲染两个元素，不要因为外观相似强行绑定
- 一次转场通常只保留少量真正重要的共享元素，避免所有内容同时飞行；具体数量服从画面

## 配置入口

在 `deck.config.ts` 给 deck 设置一个稳定组件：

```tsx
import { DeckOverlay } from './overlay'

export const deck = defineDeck({
  // ...
  overlay: DeckOverlay,
  slides: defineSlides(import.meta.glob('./slides/*.tsx', { eager: true })),
})
```

运行时会在主放映、概览、演讲者现场、下一步预览和 print 导出中统一挂载它。不要在 slide 文件里重复挂 overlay。

## 章节标题飞行

章节页和下一页只留下不可见占位，真实标题由 overlay 渲染一次：

```tsx
// slides/05-section.tsx
<SectionSlide
  index="02"
  title="主张与证据"
  sharedTitle="evidence-title"
/>

// slides/06-evidence.tsx
<ContentSlide
  title="主张与证据"
  sharedTitle="evidence-title"
>
  ...
</ContentSlide>
```

在常驻 overlay 中绑定两个稳定页面 ID：

```tsx
<SharedTitleFlight
  name="evidence-title"
  page={page}
  print={print}
  sectionId="evidence-section"
  contentId="evidence"
/>
```

`SharedTitleFlight` 会读取两页 `meta.title`，并强制校验页面相邻且文字完全相同。默认停靠点与内置 `SectionSlide`、`ContentSlide` 对齐。标题较长、换行或使用自定义布局时，通过 `sectionTarget`、`contentTarget` 覆盖完整坐标，或改用通用 `SharedElement`。

## 任意共享元素

`SharedElement` 使用语义 `name` 和稳定 slide `meta.id`。每个 frame 都必须给出固定画布中的完整目标框：

```tsx
<SharedElement
  name="product-preview"
  page={page}
  print={print}
  frames={[
    {
      slide: 'product-section',
      target: {
        x: 760, y: 180, width: 360, height: 240,
        opacity: 1, scale: 1, rotate: 0,
      },
    },
    {
      slide: 'product-detail',
      target: {
        x: 80, y: 170, width: 720, height: 420,
        opacity: 1, scale: 1, rotate: 0,
      },
    },
  ]}
>
  <img className="h-full w-full object-cover" src={preview} alt="产品主界面" />
</SharedElement>
```

在对应页面使用同名 `SharedElementPlaceholder` 保留布局。frame 未命中的页面会在确定性停靠点隐藏，节点不会卸载，因此正向、反向、跳页和 print 乱序导出得到一致结果。

## 签名飞行

`SignatureFlight` 使用稳定的 `meta.id`，不使用绝对页码：

```tsx
import { SignatureFlight } from './deck'
import { SignatureMark } from './components/SignatureMark'
import type { DeckOverlayProps } from './deck'

export function DeckOverlay({ page, print }: DeckOverlayProps) {
  return (
    <SignatureFlight
      page={page}
      print={print}
      coverId="signature-intro"
      closingId="end"
      render={({ mode, instant, className }) => (
        <SignatureMark
          className={className}
          instant={instant || mode === 'corner' || mode === 'gone'}
          loop={!instant && mode === 'cover'}
          redraw={!instant && mode === 'closing'}
        />
      )}
    />
  )
}
```

`SignatureMark` 由当前项目根据用户提供的签名、公司 logo 或其他标识自行实现，skill 不内置任何人的签名字形。轨迹由本次故事决定，例如开场建立身份、章节中缩到角落、收尾回到中心；通过 `slots` 和 `aspectRatio` 调整尺寸和位置，不复刻历史演讲的固定页码。

开场页可以返回 `null` 让签名单独出现；收尾页为签名留透明占位。不要让正文与 overlay 争同一坐标。

## 手写特殊轨迹

只有预制组件覆盖不了的轨迹才直接使用 `CrossPageElement`：

```tsx
const sectionPage = resolveSlidePage(deck.slides, 'section')
const contentPage = resolveSlidePage(deck.slides, 'content')
const target = page === sectionPage
  ? { x: 640, y: 320, width: 300, height: 72, scale: 1.25, rotate: 0, opacity: 1 }
  : page === contentPage
    ? { x: 80, y: 56, width: 300, height: 58, scale: 1, rotate: 0, opacity: 1 }
    : { x: 80, y: 56, width: 300, height: 58, scale: 1, rotate: 0, opacity: 0 }

return <CrossPageElement target={target} print={print}>章节标题</CrossPageElement>
```

## 实现规则

- 语义身份使用 `name`，页面身份使用稳定 `meta.id`；不要使用 DOM `id` 或绝对页码
- 每个共享对象在 `deck.overlay` 中只渲染一次，页面本体只放同名不可见占位
- 每一页都保留同一个 `SharedElement`，隐藏只改 opacity，不条件卸载
- 不写 `key={page}`，否则 React 会重建节点，无法跨页飞行
- 每个目标完整指定 x、y、width、height、scale、rotate 和 opacity，保证 print 乱序导出也正确
- 使用 `SharedElementPlaceholder` 保留同尺寸布局，不手写第二份可见元素
- print 与 reduced motion 自动使用零时长终态，不依赖固定 sleep 或 View Transitions API
