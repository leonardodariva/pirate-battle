import type { GameConfig } from '../config/gameConfig'
import type { EnemyState } from './EnemySystem'
import { circleIntersectsRectangle, insetRectangle } from '../utils/collision'

interface PlayerPosition {
  x: number
  y: number
}

export interface SpawnState {
  elapsedSeconds: number
  spawnedEnemyCount: number
  nextEnemyId: number
}

export interface SpawnUpdateResult {
  enemies: EnemyState[]
  spawnState: SpawnState
}

/**
 * The first two spawns are intentional so a normal match always demonstrates
 * both required enemy behaviours. The later three-item cycle gives Chasers a
 * two-to-one presence without introducing non-deterministic random values.
 */
const ENEMY_TYPE_CYCLE = ['chaser', 'chaser', 'shooter'] as const

export function createInitialSpawnState(): SpawnState {
  return {
    elapsedSeconds: 0,
    spawnedEnemyCount: 0,
    nextEnemyId: 1,
  }
}

export function spawnInitialEnemy(
  player: PlayerPosition,
  config: GameConfig,
): SpawnUpdateResult {
  return spawnEnemy([], createInitialSpawnState(), player, config)
}

export function updateSpawning(
  enemies: EnemyState[],
  spawnState: SpawnState,
  player: PlayerPosition,
  deltaSeconds: number,
  config: GameConfig,
): SpawnUpdateResult {
  const elapsedSeconds = spawnState.elapsedSeconds + deltaSeconds

  if (elapsedSeconds < config.spawn.intervalSeconds) {
    return {
      enemies,
      spawnState: { ...spawnState, elapsedSeconds },
    }
  }

  const result = spawnEnemy(enemies, spawnState, player, config)

  return {
    enemies: result.enemies,
    spawnState: {
      ...result.spawnState,
      elapsedSeconds: elapsedSeconds - config.spawn.intervalSeconds,
    },
  }
}

export function getEnemyTypeForSpawn(spawnedEnemyCount: number) {
  if (spawnedEnemyCount === 0) {
    return 'chaser' as const
  }

  if (spawnedEnemyCount === 1) {
    return 'shooter' as const
  }

  return (
    ENEMY_TYPE_CYCLE[
      (spawnedEnemyCount - 2) % ENEMY_TYPE_CYCLE.length
    ] ?? 'chaser'
  )
}

function spawnEnemy(
  enemies: EnemyState[],
  spawnState: SpawnState,
  player: PlayerPosition,
  config: GameConfig,
): SpawnUpdateResult {
  const type = getEnemyTypeForSpawn(spawnState.spawnedEnemyCount)
  const radius =
    type === 'chaser'
      ? config.chaser.collisionRadius
      : config.shooter.collisionRadius
  const position = config.spawn.positions.find((candidate) =>
    isValidSpawnPosition(candidate, radius, player, config),
  )

  if (!position) {
    return { enemies, spawnState }
  }

  const enemy: EnemyState =
    type === 'chaser'
      ? {
          id: spawnState.nextEnemyId,
          type,
          x: position.x,
          y: position.y,
          rotation: 0,
          health: config.chaser.maxHealth,
        }
      : {
          id: spawnState.nextEnemyId,
          type,
          x: position.x,
          y: position.y,
          rotation: 0,
          health: config.shooter.maxHealth,
          fireCooldownRemaining: 0,
        }

  return {
    enemies: [...enemies, enemy],
    spawnState: {
      elapsedSeconds: spawnState.elapsedSeconds,
      spawnedEnemyCount: spawnState.spawnedEnemyCount + 1,
      nextEnemyId: spawnState.nextEnemyId + 1,
    },
  }
}

function isValidSpawnPosition(
  candidate: PlayerPosition,
  radius: number,
  player: PlayerPosition,
  config: GameConfig,
) {
  const insideArena =
    candidate.x >= radius &&
    candidate.x <= config.arena.width - radius &&
    candidate.y >= radius &&
    candidate.y <= config.arena.height - radius
  const farEnoughFromPlayer =
    Math.hypot(candidate.x - player.x, candidate.y - player.y) >=
    config.spawn.minimumDistanceFromPlayer
  const intersectsIsland = config.islands.some((island) =>
    circleIntersectsRectangle(
      candidate.x,
      candidate.y,
      radius,
      insetRectangle(island, island.collisionInset),
    ),
  )

  return insideArena && farEnoughFromPlayer && !intersectsIsland
}
