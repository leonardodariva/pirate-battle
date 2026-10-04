import type { GameState } from '../core/GameState'

export interface GameTestSnapshot {
  player: {
    x: number
    y: number
    rotation: number
    health: number
  }
  enemies: Array<{
    id: number
    type: 'chaser' | 'shooter'
    x: number
    y: number
    rotation: number
    health: number
    fireCooldownRemaining?: number
  }>
  projectiles: Array<{
    id: number
    x: number
    y: number
    direction: number
    owner: 'player' | 'enemy'
  }>
  frontCannonCooldownRemaining: number
  leftBroadsideCooldownRemaining: number
  rightBroadsideCooldownRemaining: number
  score: number
}

interface GameTestBridge {
  getState: () => GameTestSnapshot
  placePlayer: (setup: PlayerTestSetup) => void
  placeChaser: (setup: ChaserTestSetup) => void
  placeShooter: (setup: ShooterTestSetup) => void
}

interface PlayerTestSetup {
  x: number
  y: number
  rotation: number
}

interface ChaserTestSetup {
  x: number
  y: number
  rotation: number
  health: number
}

interface ShooterTestSetup extends ChaserTestSetup {
  fireCooldownRemaining?: number
}

declare global {
  interface Window {
    __GAME_TEST__?: GameTestBridge
  }
}

export function installGameTestBridge(
  readState: () => GameState,
  placePlayer: (setup: PlayerTestSetup) => void,
  placeChaser: (setup: ChaserTestSetup) => void,
  placeShooter: (setup: ShooterTestSetup) => void,
) {
  if (import.meta.env.MODE !== 'test') {
    return () => {}
  }

  const bridge: GameTestBridge = {
    getState: () => {
      const state = readState()

      return {
        player: { ...state.player },
        enemies: state.enemies.map((enemy) => ({ ...enemy })),
        projectiles: state.projectiles.map((projectile) => ({
          id: projectile.id,
          x: projectile.x,
          y: projectile.y,
          direction: projectile.direction,
          owner: projectile.owner,
        })),
        frontCannonCooldownRemaining:
          state.frontCannonCooldownRemaining,
        leftBroadsideCooldownRemaining:
          state.leftBroadsideCooldownRemaining,
        rightBroadsideCooldownRemaining:
          state.rightBroadsideCooldownRemaining,
        score: state.score,
      }
    },
    placePlayer,
    placeChaser,
    placeShooter,
  }

  window.__GAME_TEST__ = bridge

  return () => {
    if (window.__GAME_TEST__ === bridge) {
      delete window.__GAME_TEST__
    }
  }
}
