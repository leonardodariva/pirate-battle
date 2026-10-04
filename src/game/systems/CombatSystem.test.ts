import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import type { EnemyState } from './EnemySystem'
import { resolveChaserPlayerCollisions } from './CombatSystem'

const PLAYER = {
  x: 640,
  y: 360,
  rotation: 0,
  health: GAME_CONFIG.player.maxHealth,
}

function createChaser(overrides: Partial<EnemyState> = {}): EnemyState {
  return {
    id: 1,
    type: 'chaser',
    x: 640,
    y: 310,
    rotation: Math.PI,
    health: GAME_CONFIG.chaser.maxHealth,
    ...overrides,
  }
}

describe('resolveChaserPlayerCollisions', () => {
  it('damages the player once, removes the chaser, and awards no score', () => {
    const result = resolveChaserPlayerCollisions(
      PLAYER,
      [createChaser()],
      7,
      GAME_CONFIG,
    )

    expect(result.player.health).toBe(
      GAME_CONFIG.player.maxHealth - GAME_CONFIG.chaser.collisionDamage,
    )
    expect(result.enemies).toHaveLength(0)
    expect(result.score).toBe(7)

    const nextResult = resolveChaserPlayerCollisions(
      result.player,
      result.enemies,
      result.score,
      GAME_CONFIG,
    )
    expect(nextResult.player.health).toBe(result.player.health)
  })

  it('keeps state unchanged when the chaser is too far away', () => {
    const enemy = createChaser({ x: 100, y: 100 })
    const result = resolveChaserPlayerCollisions(
      PLAYER,
      [enemy],
      0,
      GAME_CONFIG,
    )

    expect(result.player).toEqual(PLAYER)
    expect(result.enemies).toEqual([enemy])
    expect(result.score).toBe(0)
  })
})
