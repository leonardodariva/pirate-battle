import type { GameConfig } from '../config/gameConfig'

export interface PlayerInput {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
  fireFront: boolean
}

export interface PlayerState {
  x: number
  y: number
  rotation: number
}

export interface ProjectileState {
  id: number
  x: number
  y: number
  direction: number
  speed: number
  damage: number
  lifetimeRemaining: number
  owner: 'player' | 'enemy'
}

export interface GameState {
  player: PlayerState
  projectiles: ProjectileState[]
  frontCannonCooldownRemaining: number
  nextProjectileId: number
}

export function createInitialGameState(config: GameConfig): GameState {
  return {
    player: {
      x: config.arena.width / 2,
      y: config.arena.height / 2,
      rotation: 0,
    },
    projectiles: [],
    frontCannonCooldownRemaining: 0,
    nextProjectileId: 1,
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

  const player = {
    x: clamp(nextX, radius, config.arena.width - radius),
    y: clamp(nextY, radius, config.arena.height - radius),
    rotation,
  }
  let frontCannonCooldownRemaining = Math.max(
    0,
    state.frontCannonCooldownRemaining - deltaSeconds,
  )
  let nextProjectileId = state.nextProjectileId
  const projectiles = state.projectiles
    .map((projectile) => ({
      ...projectile,
      x:
        projectile.x +
        Math.sin(projectile.direction) * projectile.speed * deltaSeconds,
      y:
        projectile.y -
        Math.cos(projectile.direction) * projectile.speed * deltaSeconds,
      lifetimeRemaining: projectile.lifetimeRemaining - deltaSeconds,
    }))
    .filter(
      (projectile) =>
        projectile.lifetimeRemaining > 0 &&
        projectile.x >= 0 &&
        projectile.x <= config.arena.width &&
        projectile.y >= 0 &&
        projectile.y <= config.arena.height,
    )

  if (input.fireFront && frontCannonCooldownRemaining === 0) {
    projectiles.push({
      id: nextProjectileId,
      x:
        player.x +
        Math.sin(player.rotation) * config.frontCannon.spawnOffset,
      y:
        player.y -
        Math.cos(player.rotation) * config.frontCannon.spawnOffset,
      direction: player.rotation,
      speed: config.frontCannon.projectileSpeed,
      damage: config.frontCannon.projectileDamage,
      lifetimeRemaining: config.frontCannon.projectileLifetimeSeconds,
      owner: 'player',
    })
    nextProjectileId += 1
    frontCannonCooldownRemaining = config.frontCannon.cooldownSeconds
  }

  return {
    player,
    projectiles,
    frontCannonCooldownRemaining,
    nextProjectileId,
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2
  return ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI
}
