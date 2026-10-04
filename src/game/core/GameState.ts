import type { GameConfig } from '../config/gameConfig'
import {
  circleIntersectsRectangle,
  insetRectangle,
} from '../utils/collision'

export interface PlayerInput {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
  fireFront: boolean
  fireLeftBroadside: boolean
  fireRightBroadside: boolean
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
  leftBroadsideCooldownRemaining: number
  rightBroadsideCooldownRemaining: number
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
    leftBroadsideCooldownRemaining: 0,
    rightBroadsideCooldownRemaining: 0,
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
  const candidateRotation = normalizeAngle(
    state.player.rotation +
      turnDirection * config.player.rotationSpeed * deltaSeconds,
  )
  const rotation = playerCollidesWithIsland(
    state.player.x,
    state.player.y,
    candidateRotation,
    config,
  )
    ? state.player.rotation
    : candidateRotation

  const distance = input.forward
    ? config.player.movementSpeed * deltaSeconds
    : 0
  const nextX = state.player.x + Math.sin(rotation) * distance
  const nextY = state.player.y - Math.cos(rotation) * distance
  const boundaryRadius = config.player.boundaryRadius
  const candidateX = clamp(
    nextX,
    boundaryRadius,
    config.arena.width - boundaryRadius,
  )
  const candidateY = clamp(
    nextY,
    boundaryRadius,
    config.arena.height - boundaryRadius,
  )
  const playerX = playerCollidesWithIsland(
    candidateX,
    state.player.y,
    rotation,
    config,
  )
    ? state.player.x
    : candidateX
  const playerY = playerCollidesWithIsland(
    playerX,
    candidateY,
    rotation,
    config,
  )
    ? state.player.y
    : candidateY
  const player = { x: playerX, y: playerY, rotation }
  let frontCannonCooldownRemaining = Math.max(
    0,
    state.frontCannonCooldownRemaining - deltaSeconds,
  )
  let leftBroadsideCooldownRemaining = Math.max(
    0,
    state.leftBroadsideCooldownRemaining - deltaSeconds,
  )
  let rightBroadsideCooldownRemaining = Math.max(
    0,
    state.rightBroadsideCooldownRemaining - deltaSeconds,
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
        projectile.y <= config.arena.height &&
        !config.islands.some((island) =>
          circleIntersectsRectangle(
            projectile.x,
            projectile.y,
            config.projectiles.collisionRadius,
            insetRectangle(island, island.collisionInset),
          ),
        ),
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

  if (input.fireLeftBroadside && leftBroadsideCooldownRemaining === 0) {
    nextProjectileId = addBroadsideProjectiles(
      projectiles,
      nextProjectileId,
      player,
      -1,
      config,
    )
    leftBroadsideCooldownRemaining = config.broadside.cooldownSeconds
  }

  if (input.fireRightBroadside && rightBroadsideCooldownRemaining === 0) {
    nextProjectileId = addBroadsideProjectiles(
      projectiles,
      nextProjectileId,
      player,
      1,
      config,
    )
    rightBroadsideCooldownRemaining = config.broadside.cooldownSeconds
  }

  return {
    player,
    projectiles,
    frontCannonCooldownRemaining,
    leftBroadsideCooldownRemaining,
    rightBroadsideCooldownRemaining,
    nextProjectileId,
  }
}

function addBroadsideProjectiles(
  projectiles: ProjectileState[],
  firstProjectileId: number,
  player: PlayerState,
  sideDirection: -1 | 1,
  config: GameConfig,
) {
  const direction = normalizeAngle(
    player.rotation + sideDirection * (Math.PI / 2),
  )
  const sideX = Math.sin(direction)
  const sideY = -Math.cos(direction)
  const forwardX = Math.sin(player.rotation)
  const forwardY = -Math.cos(player.rotation)
  const cannonOffsets = [
    -config.broadside.cannonSpacing,
    0,
    config.broadside.cannonSpacing,
  ]

  cannonOffsets.forEach((cannonOffset, index) => {
    projectiles.push({
      id: firstProjectileId + index,
      x:
        player.x +
        sideX * config.broadside.spawnOffset +
        forwardX * cannonOffset,
      y:
        player.y +
        sideY * config.broadside.spawnOffset +
        forwardY * cannonOffset,
      direction,
      speed: config.broadside.projectileSpeed,
      damage: config.broadside.projectileDamage,
      lifetimeRemaining: config.broadside.projectileLifetimeSeconds,
      owner: 'player',
    })
  })

  return firstProjectileId + cannonOffsets.length
}

function collidesWithIsland(
  x: number,
  y: number,
  radius: number,
  config: GameConfig,
) {
  return config.islands.some((island) =>
    circleIntersectsRectangle(
      x,
      y,
      radius,
      insetRectangle(island, island.collisionInset),
    ),
  )
}

function playerCollidesWithIsland(
  x: number,
  y: number,
  rotation: number,
  config: GameConfig,
) {
  const forwardX = Math.sin(rotation)
  const forwardY = -Math.cos(rotation)

  return config.player.collisionOffsets.some((offset) =>
    collidesWithIsland(
      x + forwardX * offset,
      y + forwardY * offset,
      config.player.collisionRadius,
      config,
    ),
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2
  return ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI
}
