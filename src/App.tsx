import { useState } from 'react'
import jungleGamingLogoUrl from '../assets/logo_jungle_gaming.svg'
import menuTitleUrl from '../assets/png/default/ui/menu/title_pirate_battle.png'
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
          <span><kbd>Q</kbd> Left broadside</span>
          <span><kbd>E</kbd> Right broadside</span>
        </div>
      </main>
    )
  }

  return (
    <main className="menu-screen">
      <section className="menu-card" aria-labelledby="game-title">
        <img
          className="jungle-logo"
          src={jungleGamingLogoUrl}
          alt="Jungle Gaming"
        />
        <h1 id="game-title" className="visually-hidden">
          Pirate Battle
        </h1>
        <img
          className="menu-title"
          src={menuTitleUrl}
          alt=""
          aria-hidden="true"
        />
        <p className="menu-tagline">Set sail. Take command.</p>
        <button className="primary-button" onClick={() => setIsPlaying(true)}>
          Play
        </button>
        <p className="menu-copy">Navigate. Explore. Survive.</p>
      </section>
    </main>
  )
}

export default App
