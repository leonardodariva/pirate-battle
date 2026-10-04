import { useState } from 'react'
import jungleGamingLogoUrl from '../assets/logo_jungle_gaming.svg'
import menuTitleUrl from '../assets/png/default/ui/menu/title_pirate_battle.png'
import type { MatchRecord } from './api/types'
import { createConfigKey } from './game/config/configKey'
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
import { RankingScreen } from './features/ranking/RankingScreen'
import { MatchHistoryScreen } from './features/history/MatchHistoryScreen'
import { useMatchRegistration } from './features/results/useMatchRegistration'
import {
  loadGameOptions,
  saveGameOptions,
} from './storage/gameOptionsStorage'
import { getOrCreatePlayerIdentity } from './storage/playerIdentityStorage'
import './App.css'

type AppScreen =
  | 'menu'
  | 'options'
  | 'controls'
  | 'ranking'
  | 'history'
  | 'game'

function App() {
  const [screen, setScreen] = useState<AppScreen>('menu')
  const [options, setOptions] = useState<GameOptions>(loadGameOptions)
  const [player] = useState(getOrCreatePlayerIdentity)
  const [matchConfig, setMatchConfig] = useState<GameConfig>(() =>
    createMatchConfig(GAME_CONFIG, options),
  )
  const [matchKey, setMatchKey] = useState(0)
  const [matchId, setMatchId] = useState(() => crypto.randomUUID())
  const [pauseRequestId, setPauseRequestId] = useState(0)
  const [gameUiState, setGameUiState] = useState<GameUiState | null>(null)
  const [completedMatch, setCompletedMatch] = useState<MatchRecord | null>(null)
  const registration = useMatchRegistration({ match: completedMatch })

  const startMatch = () => {
    setMatchConfig(createMatchConfig(GAME_CONFIG, options))
    setMatchId(crypto.randomUUID())
    setGameUiState(null)
    setCompletedMatch(null)
    registration.reset()
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

  const handleGameStateChange = (nextState: GameUiState) => {
    setGameUiState(nextState)

    if (nextState.status !== 'ended' || nextState.endReason === null) {
      return
    }

    const endReason = nextState.endReason

    setCompletedMatch((currentMatch) => {
      if (currentMatch?.matchId === matchId) {
        return currentMatch
      }

      const configuration = {
        sessionDurationSeconds: matchConfig.match.sessionDurationSeconds,
        enemySpawnIntervalSeconds: matchConfig.spawn.intervalSeconds,
      }

      return {
        matchId,
        playerId: player.playerId,
        playerName: player.playerName,
        score: nextState.score,
        durationSeconds: Math.round(nextState.elapsedTimeSeconds),
        endReason,
        completedAt: new Date().toISOString(),
        configKey: createConfigKey(configuration),
        configuration,
      }
    })
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
            onStateChange={handleGameStateChange}
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
                  <dd>{getRegistrationLabel(registration.status)}</dd>
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

  if (screen === 'ranking') {
    return (
      <RankingScreen
        options={options}
        onBack={() => setScreen('menu')}
      />
    )
  }

  if (screen === 'history') {
    return (
      <MatchHistoryScreen
        player={player}
        onBack={() => setScreen('menu')}
      />
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
          <button
            className="secondary-button menu-options-button"
            onClick={() => setScreen('ranking')}
          >
            Ranking
          </button>
          <button
            className="secondary-button menu-options-button"
            onClick={() => setScreen('history')}
          >
            Match history
          </button>
        </div>
        <p className="menu-copy">Navigate. Explore. Survive.</p>
      </section>
    </main>
  )
}

export default App

function getRegistrationLabel(
  status: 'idle' | 'pending' | 'error' | 'success',
) {
  switch (status) {
    case 'pending':
      return 'Submitting...'
    case 'success':
      return 'Confirmed'
    case 'error':
      return 'Failed'
    default:
      return 'Preparing...'
  }
}
