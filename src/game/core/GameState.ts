import type { GameConfig } from '../config/gameConfig'

export interface PlayerInput {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
}

export interface PlayerState {
  x: number
  y: number
  rotation: number
}

export interface GameState {
  player: PlayerState
}

export function createInitialGameState(config: GameConfig): GameState {
  return {
    player: {
      x: config.arena.width / 2,
      y: config.arena.height / 2,
      rotation: 0,
    },
  }
}

export function updateGameState(
  state: GameState,
  input: PlayerInput,
  deltaSeconds: number,
  config: GameConfig,
): GameState {
  const turnDirection = Number(input.turnRight) - Number(input.turnLeft)
  const rotation = normalizeAngle(
    state.player.rotation +
      turnDirection * config.player.rotationSpeed * deltaSeconds,
  )

  const distance = input.forward
    ? config.player.movementSpeed * deltaSeconds
    : 0
  const nextX = state.player.x + Math.sin(rotation) * distance
  const nextY = state.player.y - Math.cos(rotation) * distance
  const radius = config.player.boundaryRadius

  return {
    player: {
      x: clamp(nextX, radius, config.arena.width - radius),
      y: clamp(nextY, radius, config.arena.height - radius),
      rotation,
    },
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2
  return ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI
}
