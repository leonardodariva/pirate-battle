import type { GameConfig } from '../config/gameConfig'
import {
  circleIntersectsRectangle,
  getRotatedCircleCenters,
  insetRectangle,
} from '../utils/collision'
import {
  resolveChaserPlayerCollisions,
  resolveEnemyProjectileHits,
  resolvePlayerProjectileHits,
} from '../systems/CombatSystem'
import {
  updateEnemies,
  type EnemyState,
} from '../systems/EnemySystem'
import {
  spawnInitialEnemy,
  updateSpawning,
  type SpawnState,
} from '../systems/SpawnSystem'

export interface PlayerInput {
  forward: boolean
  turnLeft: boolean
  turnRight: boolean
  forwardAmount?: number
  turnAmount?: number
  desiredRotation?: number
  fireFront: boolean
  fireLeftBroadside: boolean
  fireRightBroadside: boolean
}

export interface PlayerState {
  x: number
  y: number
  rotation: number
  health: number
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
  status: 'running' | 'paused' | 'ended'
  endReason: 'timeout' | 'player_destroyed' | null
  elapsedTimeSeconds: number
  remainingTimeSeconds: number
  player: PlayerState
  enemies: EnemyState[]
  projectiles: ProjectileState[]
  frontCannonCooldownRemaining: number
  leftBroadsideCooldownRemaining: number
  rightBroadsideCooldownRemaining: number
  nextProjectileId: number
  score: number
  spawn: SpawnState
}

export function createInitialGameState(config: GameConfig): GameState {
  const player = {
    x: config.arena.width / 2,
    y: config.arena.height / 2,
    rotation: 0,
    health: config.player.maxHealth,
  }
  const initialSpawn = spawnInitialEnemy(player, config)

  return {
    status: 'running',
    endReason: null,
    elapsedTimeSeconds: 0,
    remainingTimeSeconds: config.match.sessionDurationSeconds,
    player,
    enemies: initialSpawn.enemies,
    projectiles: [],
    frontCannonCooldownRemaining: 0,
    leftBroadsideCooldownRemaining: 0,
    rightBroadsideCooldownRemaining: 0,
    nextProjectileId: 1,
    score: 0,
    spawn: initialSpawn.spawnState,
  }
}

export function updateGameState(
  state: GameState,
  input: PlayerInput,
  deltaSeconds: number,
  config: GameConfig,
): GameState {
  if (state.status !== 'running') {
    return state
  }

  const elapsedTimeSeconds = Math.min(
    config.match.sessionDurationSeconds,
    state.elapsedTimeSeconds + deltaSeconds,
  )
  const remainingTimeSeconds = Math.max(
    0,
    config.match.sessionDurationSeconds - elapsedTimeSeconds,
  )

  const maximumRotationChange =
    config.player.rotationSpeed * deltaSeconds
  const rotationChange =
    input.desiredRotation === undefined
      ? clamp(
          input.turnAmount ??
            Number(input.turnRight) - Number(input.turnLeft),
          -1,
          1,
        ) * maximumRotationChange
      : clamp(
          normalizeAngle(input.desiredRotation - state.player.rotation),
          -maximumRotationChange,
          maximumRotationChange,
        )
  const candidateRotation = normalizeAngle(
    state.player.rotation + rotationChange,
  )
  const rotation = playerCollidesWithIsland(
    state.player.x,
    state.player.y,
    candidateRotation,
    config,
  )
    ? state.player.rotation
    : candidateRotation

  const forwardAmount = clamp(
    input.forwardAmount ?? Number(input.forward),
    0,
    1,
  )
  const headingAlignment =
    input.desiredRotation === undefined
      ? 1
      : Math.max(
          0,
          Math.cos(normalizeAngle(input.desiredRotation - rotation)),
        )
  const distance =
    config.player.movementSpeed *
    forwardAmount *
    headingAlignment *
    deltaSeconds
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
  const movedPlayer = {
    x: playerX,
    y: playerY,
    rotation,
    health: state.player.health,
  }
  const enemyUpdateResult = updateEnemies(
    state.enemies,
    movedPlayer,
    deltaSeconds,
    config,
  )
  const movedEnemies = enemyUpdateResult.enemies
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
  const movedProjectiles = state.projectiles
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
  const projectileCombatResult = resolvePlayerProjectileHits(
    movedEnemies,
    movedProjectiles,
    state.score,
    config,
  )
  const contactCombatResult = resolveChaserPlayerCollisions(
    movedPlayer,
    projectileCombatResult.enemies,
    projectileCombatResult.score,
    config,
  )
  const enemyProjectileCombatResult = resolveEnemyProjectileHits(
    contactCombatResult.player,
    projectileCombatResult.projectiles,
    config,
  )
  const player = enemyProjectileCombatResult.player
  const { enemies, score } = contactCombatResult
  const projectiles = enemyProjectileCombatResult.projectiles
  const survivingEnemyIds = new Set(enemies.map((enemy) => enemy.id))

  for (const shot of enemyUpdateResult.shots) {
    if (!survivingEnemyIds.has(shot.sourceEnemyId)) {
      continue
    }

    projectiles.push({
      id: nextProjectileId,
      x: shot.x,
      y: shot.y,
      direction: shot.direction,
      speed: shot.speed,
      damage: shot.damage,
      lifetimeRemaining: shot.lifetimeRemaining,
      owner: 'enemy',
    })
    nextProjectileId += 1
  }

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

  const spawnUpdateResult =
    remainingTimeSeconds === 0
      ? { enemies, spawnState: state.spawn }
      : updateSpawning(
          enemies,
          state.spawn,
          player,
          deltaSeconds,
          config,
        )
  const endReason =
    player.health <= 0
      ? ('player_destroyed' as const)
      : remainingTimeSeconds === 0
        ? ('timeout' as const)
        : null

  return {
    status: endReason ? 'ended' : 'running',
    endReason,
    elapsedTimeSeconds,
    remainingTimeSeconds,
    player,
    enemies: spawnUpdateResult.enemies,
    projectiles,
    frontCannonCooldownRemaining,
    leftBroadsideCooldownRemaining,
    rightBroadsideCooldownRemaining,
    nextProjectileId,
    score,
    spawn: spawnUpdateResult.spawnState,
  }
}

export function pauseGameState(state: GameState): GameState {
  return state.status === 'running' ? { ...state, status: 'paused' } : state
}

export function resumeGameState(state: GameState): GameState {
  return state.status === 'paused' ? { ...state, status: 'running' } : state
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
  return getRotatedCircleCenters(
    x,
    y,
    rotation,
    config.player.collisionOffsets,
  ).some((circle) =>
    collidesWithIsland(
      circle.x,
      circle.y,
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
