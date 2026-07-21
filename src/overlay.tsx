import { SharedTitleFlight, SignatureFlight } from './deck'
import { Wordmark } from './components'
import type { DeckOverlayProps } from './deck'

export function DemoOverlay({ page, print }: DeckOverlayProps) {
  return (
    <>
      <SignatureFlight
        page={page}
        print={print}
        coverId="signature-intro"
        closingId="end"
        render={({ mode, instant, className }) => (
          <Wordmark
            className={className}
            instant={instant || mode === 'corner' || mode === 'gone'}
            loop={!instant && mode === 'cover'}
            redraw={!instant && mode === 'closing'}
          />
        )}
      />
      <SharedTitleFlight
        name="evidence-title"
        page={page}
        print={print}
        sectionId="evidence-section"
        contentId="evidence"
      />
    </>
  )
}
