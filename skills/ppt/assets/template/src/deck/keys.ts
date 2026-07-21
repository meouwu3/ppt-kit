/* 中文输入法开着的时候，Chrome 的 keydown 只报 e.key === 'Process'，
   f/o/空格/数字全都对不上号——放映现场十有八九开着输入法。
   从 e.code 把物理键还原出来。 */
export function effectiveKey(e: KeyboardEvent): string {
  const key = (() => {
    if (e.key !== 'Process' && !e.isComposing) return e.key
    const { code } = e
    if (code.startsWith('Key')) return code.slice(3).toLowerCase()
    if (code.startsWith('Digit')) return code.slice(5)
    if (code === 'Space') return ' '
    return e.key
  })()
  // 大写锁定/Shift 下 e.key 是大写——快捷键全是小写字母，统一归一
  return /^[A-Z]$/.test(key) ? key.toLowerCase() : key
}

/** f 键全屏开关：播放窗口和演讲者窗口共用 */
export function toggleFullscreen() {
  const root = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void
  }
  if (document.fullscreenElement) void document.exitFullscreen()
  else
    root.requestFullscreen().catch(() => {
      // 老 Safari 只有带前缀的版本
      root.webkitRequestFullscreen?.()
    })
}
