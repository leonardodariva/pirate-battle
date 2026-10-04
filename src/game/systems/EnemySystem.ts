import type { GameConfig } from '../config/gameConfig'
import {
  circleIntersectsRectangle,
  expandRectangle,
  insetRectangle,
  segmentIntersectsRectangle,
  type RectangleBounds,
} from '../utils/collision'

interface BaseEnemyState {
  id: number
  x: number
  y: number
  rotation: number
  health: number
}

export interface ChaserState extends BaseEnemyState {
  type: 'chaser'
}

export interface ShooterState extends BaseEnemyState {
  type: 'shooter'
  fireCooldownRemaining: number
}

export type EnemyState = ChaserState | ShooterState

export interface EnemyShot {
  sourceEnemyId: number
  x: number
  y: number
  direction: number
  speed: number
  damage: number
  lifetimeRemaining: number
}

export interface EnemyUpdateResult {
  enemies: EnemyState[]
  shots: EnemyShot[]
}

interface TargetPosition {
  x: number
  y: number
}

const WAYPOINT_CLEARANCE = 12

export function updateEnemies(
  enemies: EnemyState[],
  target: TargetPosition,
  deltaSeconds: number,
  config: GameConfig,
): EnemyUpdateResult {
  const shots: EnemyShot[] = []
  const updatedEnemies = enemies.map((enemy) => {
    if (enemy.type === 'chaser') {
      return updateChaser(enemy, target, deltaSeconds, config)
    }

    const result = updateShooter(enemy, target, deltaSeconds, config)
    if (result.shot) {
      shots.push(result.shot)
    }
    return result.enemy
  })

  return { enemies: updatedEnemies, shots }
}

function updateChaser(
  enemy: ChaserState,
  target: TargetPosition,
  deltaSeconds: number,
  config: GameConfig,
): EnemyState {
  const navigationTarget = getNavigationTarget(
    enemy,
    target,
    config.chaser.collisionRadius,
    config,
  )
  return moveEnemyToward(
    enemy,
    navigationTarget,
    config.chaser.movementSpeed,
    config.chaser.rotationSpeed,
    config.chaser.collisionRadius,
    deltaSeconds,
    config,
  )
}

function updateShooter(
  enemy: ShooterState,
  target: TargetPosition,
  deltaSeconds: number,
  config: GameConfig,
): { enemy: ShooterState; shot?: EnemyShot } {
  const distanceToTarget = Math.hypot(target.x - enemy.x, target.y - enemy.y)
  const directPathClear = hasClearPath(
    enemy,
    target,
    config.shooter.collisionRadius,
    config,
  )
  const shouldApproach =
    distanceToTarget > config.shooter.attackRange || !directPathClear
  const navigationTarget = shouldApproach
    ? getNavigationTarget(
        enemy,
        target,
        config.shooter.collisionRadius,
        config,
      )
    : target
  const movedEnemy = shouldApproach
    ? moveEnemyToward(
        enemy,
        navigationTarget,
        config.shooter.movementSpeed,
        config.shooter.rotationSpeed,
        config.shooter.collisionRadius,
        deltaSeconds,
        config,
      )
    : {
        ...enemy,
        rotation: rotateToward(
          enemy.rotation,
          getDirection(enemy, target),
          config.shooter.rotationSpeed * deltaSeconds,
        ),
      }
  let fireCooldownRemaining = Math.max(
    0,
    movedEnemy.fireCooldownRemaining - deltaSeconds,
  )
  const aimDifference = normalizeAngle(
    getDirection(movedEnemy, target) - movedEnemy.rotation,
  )
  const canFire =
    !shouldApproach &&
    Math.abs(aimDifference) <= config.shooter.aimToleranceRadians &&
    fireCooldownRemaining === 0

  if (!canFire) {
    return {
      enemy: { ...movedEnemy, fireCooldownRemaining },
    }
  }

  fireCooldownRemaining = config.shooter.fireCooldownSeconds
  return {
    enemy: { ...movedEnemy, fireCooldownRemaining },
    shot: {
      sourceEnemyId: enemy.id,
      x:
        movedEnemy.x +
        Math.sin(movedEnemy.rotation) * config.shooter.projectileSpawnOffset,
      y:
        movedEnemy.y -
        Math.cos(movedEnemy.rotation) * config.shooter.projectileSpawnOffset,
      direction: movedEnemy.rotation,
      speed: config.shooter.projectileSpeed,
      damage: config.shooter.projectileDamage,
      lifetimeRemaining: config.shooter.projectileLifetimeSeconds,
    },
  }
}

function moveEnemyToward<Enemy extends EnemyState>(
  enemy: Enemy,
  target: TargetPosition,
  movementSpeed: number,
  rotationSpeed: number,
  collisionRadius: number,
  deltaSeconds: number,
  config: GameConfig,
): Enemy {
  const desiredRotation = Math.atan2(
    target.x - enemy.x,
    -(target.y - enemy.y),
  )
  const rotation = rotateToward(
    enemy.rotation,
    desiredRotation,
    rotationSpeed * deltaSeconds,
  )
  const distance = movementSpeed * deltaSeconds
  const candidateX = clamp(
    enemy.x + Math.sin(rotation) * distance,
    collisionRadius,
    config.arena.width - collisionRadius,
  )
  const candidateY = clamp(
    enemy.y - Math.cos(rotation) * distance,
    collisionRadius,
    config.arena.height - collisionRadius,
  )
  const x = enemyCollidesWithIsland(candidateX, enemy.y, collisionRadius, config)
    ? enemy.x
    : candidateX
  const y = enemyCollidesWithIsland(x, candidateY, collisionRadius, config)
    ? enemy.y
    : candidateY

  return {
    ...enemy,
    x,
    y,
    rotation,
  }
}

function getNavigationTarget(
  enemy: EnemyState,
  target: TargetPosition,
  collisionRadius: number,
  config: GameConfig,
): TargetPosition {
  const obstacles = getObstacleBounds(collisionRadius, config)
  const blockingObstacle = obstacles.find((obstacle) =>
    segmentIntersectsRectangle(
      enemy.x,
      enemy.y,
      target.x,
      target.y,
      obstacle,
    ),
  )

  if (!blockingObstacle) {
    return target
  }

  const waypoints = getObstacleWaypoints(blockingObstacle)
  const [topLeft, topRight, bottomRight, bottomLeft] = waypoints
  const candidateRoutes = [
    [topLeft],
    [topRight],
    [bottomRight],
    [bottomLeft],
    [topLeft, topRight],
    [topRight, topLeft],
    [topRight, bottomRight],
    [bottomRight, topRight],
    [bottomRight, bottomLeft],
    [bottomLeft, bottomRight],
    [bottomLeft, topLeft],
    [topLeft, bottomLeft],
  ]
  const validRoutes = candidateRoutes.filter((route) =>
    routeIsClear([enemy, ...route, target], obstacles),
  )
  const shortestRoute = validRoutes.reduce<TargetPosition[] | undefined>(
    (shortest, route) =>
      !shortest || routeLength([enemy, ...route, target]) <
          routeLength([enemy, ...shortest, target])
        ? route
        : shortest,
    undefined,
  )

  return shortestRoute?.[0] ?? target
}

function hasClearPath(
  start: TargetPosition,
  target: TargetPosition,
  collisionRadius: number,
  config: GameConfig,
) {
  return getObstacleBounds(collisionRadius, config).every(
    (obstacle) =>
      !segmentIntersectsRectangle(
        start.x,
        start.y,
        target.x,
        target.y,
        obstacle,
      ),
  )
}

function getObstacleBounds(collisionRadius: number, config: GameConfig) {
  return config.islands.map((island) =>
    expandRectangle(
      insetRectangle(island, island.collisionInset),
      collisionRadius,
    ),
  )
}

function getObstacleWaypoints(obstacle: RectangleBounds) {
  const left = obstacle.x - WAYPOINT_CLEARANCE
  const right = obstacle.x + obstacle.width + WAYPOINT_CLEARANCE
  const top = obstacle.y - WAYPOINT_CLEARANCE
  const bottom = obstacle.y + obstacle.height + WAYPOINT_CLEARANCE

  return [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ] as const
}

function routeIsClear(
  route: TargetPosition[],
  obstacles: RectangleBounds[],
) {
  return route.slice(1).every((point, index) => {
    const previousPoint = route[index]

    return (
      previousPoint !== undefined &&
      obstacles.every(
        (obstacle) =>
          !segmentIntersectsRectangle(
            previousPoint.x,
            previousPoint.y,
            point.x,
            point.y,
            obstacle,
          ),
      )
    )
  })
}

function routeLength(route: TargetPosition[]) {
  return route.slice(1).reduce((total, point, index) => {
    const previousPoint = route[index]

    return previousPoint
      ? total + Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y)
      : total
  }, 0)
}

function enemyCollidesWithIsland(
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

export function getEnemyCollisionRadius(enemy: EnemyState, config: GameConfig) {
  return enemy.type === 'chaser'
    ? config.chaser.collisionRadius
    : config.shooter.collisionRadius
}

export function getEnemyMaxHealth(enemy: EnemyState, config: GameConfig) {
  return enemy.type === 'chaser'
    ? config.chaser.maxHealth
    : config.shooter.maxHealth
}

function getDirection(start: TargetPosition, target: TargetPosition) {
  return Math.atan2(target.x - start.x, -(target.y - start.y))
}

function rotateToward(
  rotation: number,
  desiredRotation: number,
  maximumTurn: number,
) {
  const rotationDifference = normalizeAngle(desiredRotation - rotation)
  return normalizeAngle(
    rotation + clamp(rotationDifference, -maximumTurn, maximumTurn),
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum)
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2
  return ((((angle + Math.PI) % fullTurn) + fullTurn) % fullTurn) - Math.PI
}
