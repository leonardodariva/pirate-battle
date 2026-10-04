import { useState } from 'react'
import jungleGamingLogoUrl from '../assets/logo_jungle_gaming.svg'
import menuTitleUrl from '../assets/png/default/ui/menu/title_pirate_battle.png'
import {
  GameCanvas,
  type GameUiState,
} from './game/rendering/GameCanvas'
import './App.css'

function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [matchKey, setMatchKey] = useState(0)
  const [gameUiState, setGameUiState] = useState<GameUiState | null>(null)

  const startMatch = () => {
    setGameUiState(null)
    setMatchKey((currentKey) => currentKey + 1)
    setIsPlaying(true)
  }

  const leaveMatch = () => {
    setIsPlaying(false)
    setGameUiState(null)
  }

  if (isPlaying) {
    const remainingSeconds = Math.ceil(gameUiState?.remainingTimeSeconds ?? 120)
    const resultTitle =
      gameUiState?.endReason === 'timeout'
        ? 'Time is up!'
        : 'Your ship was destroyed!'

    return (
      <main className="game-screen">
        <header className="game-header">
          <div>
            <p className="eyebrow">Jungle Gaming Challenge</p>
            <h1>Pirate Battle</h1>
          </div>
          <div className="game-hud" aria-label="Current match status">
            <span>Health <strong>{gameUiState?.health ?? 100}</strong></span>
            <span>Score <strong>{gameUiState?.score ?? 0}</strong></span>
            <span>Time <strong>{remainingSeconds}s</strong></span>
          </div>
          <button className="secondary-button" onClick={leaveMatch}>
            Leave match
          </button>
        </header>

        <section className="arena-panel" aria-labelledby="arena-title">
          <h2 id="arena-title" className="visually-hidden">
            Naval combat arena
          </h2>
          <GameCanvas key={matchKey} onStateChange={setGameUiState} />

          {gameUiState?.status === 'ended' && (
            <section
              className="result-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="result-title"
            >
              <p className="eyebrow">Match complete</p>
              <h2 id="result-title">{resultTitle}</h2>
              <dl className="result-stats">
                <div>
                  <dt>Score</dt>
                  <dd>{gameUiState.score}</dd>
                </div>
                <div>
                  <dt>Time played</dt>
                  <dd>{Math.round(gameUiState.elapsedTimeSeconds)}s</dd>
                </div>
                <div>
                  <dt>Registration</dt>
                  <dd>Not submitted</dd>
                </div>
              </dl>
              <div className="result-actions">
                <button className="primary-button" onClick={startMatch} autoFocus>
                  Play again
                </button>
                <button className="secondary-button" onClick={leaveMatch}>
                  Main menu
                </button>
              </div>
            </section>
          )}
        </section>

        <div className="game-instructions" aria-label="Game controls">
          <span><kbd>W</kbd> / <kbd>↑</kbd> Move forward</span>
          <span><kbd>A</kbd> <kbd>D</kbd> / <kbd>←</kbd> <kbd>→</kbd> Rotate</span>
          <span><kbd>Space</kbd> Front cannon</span>
          <span><kbd>Q</kbd> Left broadside</span>
          <span><kbd>E</kbd> Right broadside</span>
          <span><kbd>Esc</kbd> Pause</span>
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
        <button className="primary-button" onClick={startMatch}>
          Play
        </button>
        <p className="menu-copy">Navigate. Explore. Survive.</p>
      </section>
    </main>
  )
}

export default App
