import { useState } from 'react'
import { GameCanvas } from './game/rendering/GameCanvas'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)

  if (isPlaying) {
    return (
      <main className="game-screen">
        <header className="game-header">
          <div>
            <p className="eyebrow">Jungle Gaming Challenge</p>
            <h1>Pirate Battle</h1>
          </div>
          <button className="secondary-button" onClick={() => setIsPlaying(false)}>
            Leave match
          </button>
        </header>

        <section className="arena-panel" aria-labelledby="arena-title">
          <h2 id="arena-title" className="visually-hidden">
            Naval combat arena
          </h2>
          <GameCanvas />
        </section>

        <div className="game-instructions" aria-label="Game controls">
          <span><kbd>W</kbd> / <kbd>↑</kbd> Move forward</span>
          <span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd> Rotate</span>
          <span><kbd>Space</kbd> Front cannon</span>
        </div>
      </main>
    )
  }

  return (
    <main className="menu-screen">
      <section className="menu-card" aria-labelledby="game-title">
        <p className="eyebrow">Jungle Gaming Challenge</p>
        <h1 id="game-title">Pirate Battle</h1>
        <p className="menu-copy">
          A top-down naval shooter. This first milestone validates the React and
          PixiJS foundation.
        </p>
        <button className="primary-button" onClick={() => setIsPlaying(true)}>
          Play
        </button>
      </section>
    </main>
  )
}

export default App
