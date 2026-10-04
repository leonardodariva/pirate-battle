import type { GameConfig } from '../config/gameConfig'
import { circlesIntersect, getRotatedCircleCenters } from '../utils/collision'
import type { EnemyState } from './EnemySystem'

interface CombatPlayerState {
  x: number
  y: number
  rotation: number
  health: number
}

export interface CombatResult {
  player: CombatPlayerState
  enemies: EnemyState[]
  score: number
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
