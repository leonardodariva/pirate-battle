import type { GameConfig } from '../config/gameConfig'
import {
  circleIntersectsRectangle,
  insetRectangle,
} from '../utils/collision'

export interface EnemyState {
  id: number
  type: 'chaser'
  x: number
  y: number
  rotation: number
  health: number
}

interface TargetPosition {
  x: number
  y: number
}

export function createInitialEnemies(config: GameConfig): EnemyState[] {
  return [
    {
      id: 1,
      type: 'chaser',
      x: config.chaser.firstSpawn.x,
      y: config.chaser.firstSpawn.y,
      rotation: config.chaser.firstSpawn.rotation,
      health: config.chaser.maxHealth,
    },
  ]
}

export function updateEnemies(
  enemies: EnemyState[],
  target: TargetPosition,
  deltaSeconds: number,
  config: GameConfig,
): EnemyState[] {
  return enemies.map((enemy) =>
    updateChaser(enemy, target, deltaSeconds, config),
  )
}

function updateChaser(
  enemy: EnemyState,
  target: TargetPosition,
  deltaSeconds: number,
  config: GameConfig,
): EnemyState {
  const desiredRotation = Math.atan2(
    target.x - enemy.x,
    -(target.y - enemy.y),
  )
  const rotationDifference = normalizeAngle(
    desiredRotation - enemy.rotation,
  )
  const maximumTurn = config.chaser.rotationSpeed * deltaSeconds
  const rotation = normalizeAngle(
    enemy.rotation +
      clamp(rotationDifference, -maximumTurn, maximumTurn),
  )
  const distance = config.chaser.movementSpeed * deltaSeconds
  const candidateX = clamp(
    enemy.x + Math.sin(rotation) * distance,
    config.chaser.collisionRadius,
    config.arena.width - config.chaser.collisionRadius,
  )
  const candidateY = clamp(
    enemy.y - Math.cos(rotation) * distance,
    config.chaser.collisionRadius,
    config.arena.height - config.chaser.collisionRadius,
  )
  const x = enemyCollidesWithIsland(candidateX, enemy.y, config)
    ? enemy.x
    : candidateX
  const y = enemyCollidesWithIsland(x, candidateY, config)
    ? enemy.y
    : candidateY

  return {
    ...enemy,
    x,
    y,
    rotation,
  }
}

function enemyCollidesWithIsland(
  x: number,
  y: number,
  config: GameConfig,
) {
  return config.islands.some((island) =>
    circleIntersectsRectangle(
      x,
      y,
      config.chaser.collisionRadius,
      insetRectangle(island, island.collisionInset),
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
