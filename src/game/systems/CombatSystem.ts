import type { GameConfig } from '../config/gameConfig'
import { circlesIntersect, getRotatedCircleCenters } from '../utils/collision'
import {
  getEnemyCollisionRadius,
  type EnemyState,
} from './EnemySystem'

interface CombatPlayerState {
  x: number
  y: number
  rotation: number
  health: number
}

interface CombatProjectileState {
  x: number
  y: number
  damage: number
  owner: 'player' | 'enemy'
}

export interface CombatResult {
  player: CombatPlayerState
  enemies: EnemyState[]
  score: number
}

export interface ProjectileCombatResult<
  Projectile extends CombatProjectileState,
> {
  enemies: EnemyState[]
  projectiles: Projectile[]
  score: number
}

export interface EnemyProjectileCombatResult<
  Projectile extends CombatProjectileState,
> {
  player: CombatPlayerState
  projectiles: Projectile[]
}

export function resolvePlayerProjectileHits<
  Projectile extends CombatProjectileState,
>(
  enemies: EnemyState[],
  projectiles: Projectile[],
  score: number,
  config: GameConfig,
): ProjectileCombatResult<Projectile> {
  const updatedEnemies = enemies.map((enemy) => ({ ...enemy }))
  const survivingProjectiles: Projectile[] = []

  for (const projectile of projectiles) {
    if (projectile.owner !== 'player') {
      survivingProjectiles.push(projectile)
      continue
    }

    const hitEnemy = updatedEnemies.find(
      (enemy) =>
        enemy.health > 0 &&
        circlesIntersect(
          projectile.x,
          projectile.y,
          config.projectiles.collisionRadius,
          enemy.x,
          enemy.y,
          getEnemyCollisionRadius(enemy, config),
        ),
    )

    if (!hitEnemy) {
      survivingProjectiles.push(projectile)
      continue
    }

    hitEnemy.health = Math.max(0, hitEnemy.health - projectile.damage)
  }

  const survivingEnemies = updatedEnemies.filter((enemy) => enemy.health > 0)
  const defeatedEnemyCount = updatedEnemies.length - survivingEnemies.length

  return {
    enemies: survivingEnemies,
    projectiles: survivingProjectiles,
    score: score + defeatedEnemyCount,
  }
}

export function resolveEnemyProjectileHits<
  Projectile extends CombatProjectileState,
>(
  player: CombatPlayerState,
  projectiles: Projectile[],
  config: GameConfig,
): EnemyProjectileCombatResult<Projectile> {
  const playerCircles = getRotatedCircleCenters(
    player.x,
    player.y,
    player.rotation,
    config.player.collisionOffsets,
  )
  const survivingProjectiles: Projectile[] = []
  let projectileDamage = 0

  for (const projectile of projectiles) {
    const hitPlayer =
      projectile.owner === 'enemy' &&
      playerCircles.some((circle) =>
        circlesIntersect(
          projectile.x,
          projectile.y,
          config.projectiles.collisionRadius,
          circle.x,
          circle.y,
          config.player.collisionRadius,
        ),
      )

    if (hitPlayer) {
      projectileDamage += projectile.damage
    } else {
      survivingProjectiles.push(projectile)
    }
  }

  return {
    player: {
      ...player,
      health: Math.max(0, player.health - projectileDamage),
    },
    projectiles: survivingProjectiles,
  }
}

export function resolveChaserPlayerCollisions(
  player: CombatPlayerState,
  enemies: EnemyState[],
  score: number,
  config: GameConfig,
): CombatResult {
  const playerCircles = getRotatedCircleCenters(
    player.x,
    player.y,
    player.rotation,
    config.player.collisionOffsets,
  )
  let collisionDamage = 0
  const survivingEnemies = enemies.filter((enemy) => {
    if (enemy.type !== 'chaser') {
      return true
    }

    const hitPlayer = playerCircles.some((circle) =>
      circlesIntersect(
        circle.x,
        circle.y,
        config.player.collisionRadius,
        enemy.x,
        enemy.y,
        config.chaser.collisionRadius,
      ),
    )

    if (hitPlayer) {
      collisionDamage += config.chaser.collisionDamage
    }

    return !hitPlayer
  })

  return {
    player: {
      ...player,
      health: Math.max(0, player.health - collisionDamage),
    },
    enemies: survivingEnemies,
    score,
  }
}
