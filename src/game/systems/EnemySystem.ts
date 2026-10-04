import type { GameConfig } from '../config/gameConfig'
import {
  circleIntersectsRectangle,
  expandRectangle,
  insetRectangle,
  segmentIntersectsRectangle,
  type RectangleBounds,
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

const WAYPOINT_CLEARANCE = 12

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
  const navigationTarget = getNavigationTarget(enemy, target, config)
  const desiredRotation = Math.atan2(
    navigationTarget.x - enemy.x,
    -(navigationTarget.y - enemy.y),
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

function getNavigationTarget(
  enemy: EnemyState,
  target: TargetPosition,
  config: GameConfig,
): TargetPosition {
  const obstacles = config.islands.map((island) =>
    expandRectangle(
      insetRectangle(island, island.collisionInset),
      config.chaser.collisionRadius,
    ),
  )
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
