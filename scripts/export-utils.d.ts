export function parseRange(value: string | undefined, pages: number): number[]
export function parseFormats(value?: string): string[]
export function flagOf(args: string[], name: string): string | undefined
export function hasFlag(args: string[], name: string): boolean
export function pageFile(page: number): string
export function safeOutputDir(root: string, requested?: string): string
export function validateExportOptions(options: {
  allowTodo: boolean
  allowWarnings: boolean
  draft: boolean
  formats: string[]
  range?: string
}): void
export function validateTemplateSlides(options: {
  draft: boolean
  slides: Array<{ id: string; title?: string; template?: boolean }>
}): void
export function contactSheetHtml(options: {
  title: string
  images: Array<{ page: number; file: string }>
}): string
