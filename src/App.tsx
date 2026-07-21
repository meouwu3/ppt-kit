import { DeckPlayer } from './deck/DeckPlayer'
import { deck } from './deck.config'

export default function App() {
  return <DeckPlayer deck={deck} />
}
