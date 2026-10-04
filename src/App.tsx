import { useState } from 'react'
import jungleGamingLogoUrl from '../assets/logo_jungle_gaming.svg'
import menuTitleUrl from '../assets/png/default/ui/menu/title_pirate_battle.png'
import { GAME_CONFIG, type GameConfig } from './game/config/gameConfig'
import {
  createMatchConfig,
  type GameOptions,
} from './game/config/gameOptions'
import {
  GameCanvas,
  type GameUiState,
} from './game/rendering/GameCanvas'
import { OptionsScreen } from './features/options/OptionsScreen'
import { ControlsScreen } from './features/controls/ControlsScreen'
import {
  loadGameOptions,
  saveGameOptions,
} from './storage/gameOptionsStorage'
import './App.css'

type AppScreen = 'menu' | 'options' | 'controls' | 'game'

function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [options, setOptions] = useState<GameOptions>(loadGameOptions)
  const [matchConfig, setMatchConfig] = useState<GameConfig>(() =>
    createMatchConfig(GAME_CONFIG, options),
  )
  const [matchKey, setMatchKey] = useState(0)
  const [pauseRequestId, setPauseRequestId] = useState(0)
  const [gameUiState, setGameUiState] = useState<GameUiState | null>(null)

  const startMatch = () => {
    setMatchConfig(createMatchConfig(GAME_CONFIG, options))
    setGameUiState(null)
    setPauseRequestId(0)
    setMatchKey((currentKey) => currentKey + 1)
    setScreen('game')
  }

  const leaveMatch = () => {
    setScreen('menu')
    setGameUiState(null)
  }

  const handleSaveOptions = (nextOptions: GameOptions) => {
    saveGameOptions(nextOptions)
    setOptions(nextOptions)
    setScreen('menu')
  }

  if (screen === 'game') {
    const remainingSeconds = Math.ceil(
      gameUiState?.remainingTimeSeconds ??
        matchConfig.match.sessionDurationSeconds,
    )
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
          <div className="game-header-actions">
            {gameUiState?.status === 'running' && (
              <button
                className="secondary-button"
                onClick={() =>
                  setPauseRequestId((requestId) => requestId + 1)
                }
              >
                Pause
              </button>
            )}
            <button className="secondary-button" onClick={leaveMatch}>
              Leave match
            </button>
          </div>
        </header>

        <section className="arena-panel" aria-labelledby="arena-title">
          <h2 id="arena-title" className="visually-hidden">
            Naval combat arena
          </h2>
          <GameCanvas
            key={matchKey}
            config={matchConfig}
            pauseRequestId={pauseRequestId}
            touchControlsEnabled={gameUiState?.status !== 'ended'}
            onStateChange={setGameUiState}
          />

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

  if (screen === 'options') {
    return (
      <OptionsScreen
        options={options}
        onSave={handleSaveOptions}
        onCancel={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'controls') {
    return <ControlsScreen onBack={() => setScreen('menu')} />
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
        <div className="menu-secondary-actions">
          <button
            className="secondary-button menu-options-button"
            onClick={() => setScreen('options')}
          >
            Options
          </button>
          <button
            className="secondary-button menu-options-button"
            onClick={() => setScreen('controls')}
          >
            Controls
          </button>
        </div>
        <p className="menu-copy">Navigate. Explore. Survive.</p>
      </section>
    </main>
  )
}

export default App
