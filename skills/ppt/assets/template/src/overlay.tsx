import { SharedTitleFlight } from './deck'
import type { DeckOverlayProps } from './deck'

export function DemoOverlay({ page, print }: DeckOverlayProps) {
  return (
    <SharedTitleFlight
      name="evidence-title"
      page={page}
      print={print}
      sectionId="evidence-section"
      contentId="evidence"
    />
  )
}
