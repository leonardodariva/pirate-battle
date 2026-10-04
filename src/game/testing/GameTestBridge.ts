import type { GameState } from '../core/GameState'

export interface GameTestSnapshot {
  player: {
    x: number
    y: number
    rotation: number
  }
  projectiles: Array<{
    id: number
    x: number
    y: number
    direction: number
    owner: 'player' | 'enemy'
  }>
  frontCannonCooldownRemaining: number
}

interface GameTestBridge {
  getState: () => GameTestSnapshot
}

declare global {
  interface Window {
    __GAME_TEST__?: GameTestBridge
  }
}

export function installGameTestBridge(readState: () => GameState) {
  if (import.meta.env.MODE !== 'test') {
    return () => {}
  }

  const bridge: GameTestBridge = {
    getState: () => {
      const state = readState()

      return {
        player: { ...state.player },
        projectiles: state.projectiles.map((projectile) => ({
          id: projectile.id,
          x: projectile.x,
          y: projectile.y,
          direction: projectile.direction,
          owner: projectile.owner,
        })),
        frontCannonCooldownRemaining:
          state.frontCannonCooldownRemaining,
      }
    },
  }

  window.__GAME_TEST__ = bridge

  return () => {
    if (window.__GAME_TEST__ === bridge) {
      delete window.__GAME_TEST__
    }
  }
}
