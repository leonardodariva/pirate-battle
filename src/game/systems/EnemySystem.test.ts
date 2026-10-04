import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import {
  createInitialEnemies,
  updateEnemies,
  type EnemyState,
} from './EnemySystem'

describe('EnemySystem', () => {
  it('creates the first deterministic chaser from configuration', () => {
    const enemies = createInitialEnemies(GAME_CONFIG)

    expect(enemies).toEqual([
      {
        id: 1,
        type: 'chaser',
        x: GAME_CONFIG.chaser.firstSpawn.x,
        y: GAME_CONFIG.chaser.firstSpawn.y,
        rotation: GAME_CONFIG.chaser.firstSpawn.rotation,
        health: GAME_CONFIG.chaser.maxHealth,
      },
    ])
  })

  it('moves forward toward a player directly ahead', () => {
    const enemy: EnemyState = {
      id: 1,
      type: 'chaser',
      x: 640,
      y: 600,
      rotation: 0,
      health: GAME_CONFIG.chaser.maxHealth,
    }

    const [updatedEnemy] = updateEnemies(
      [enemy],
      { x: 640, y: 360 },
      0.5,
      GAME_CONFIG,
    )

    expect(updatedEnemy?.x).toBe(enemy.x)
    expect(updatedEnemy?.y).toBe(
      enemy.y - GAME_CONFIG.chaser.movementSpeed * 0.5,
    )
    expect(updatedEnemy?.rotation).toBe(0)
  })

  it('limits how far the chaser can rotate during one update', () => {
    const enemy: EnemyState = {
      id: 1,
      type: 'chaser',
      x: 200,
      y: 360,
      rotation: 0,
      health: GAME_CONFIG.chaser.maxHealth,
    }
    const deltaSeconds = 0.1

    const [updatedEnemy] = updateEnemies(
      [enemy],
      { x: 640, y: 360 },
      deltaSeconds,
      GAME_CONFIG,
    )

    expect(updatedEnemy?.rotation).toBeCloseTo(
      GAME_CONFIG.chaser.rotationSpeed * deltaSeconds,
    )
  })

  it('does not rotate past the desired direction', () => {
    const enemy: EnemyState = {
      id: 1,
      type: 'chaser',
      x: 200,
      y: 360,
      rotation: 0,
      health: GAME_CONFIG.chaser.maxHealth,
    }

    const [updatedEnemy] = updateEnemies(
      [enemy],
      { x: 640, y: 360 },
      1,
      GAME_CONFIG,
    )

    expect(updatedEnemy?.rotation).toBeCloseTo(Math.PI / 2)
  })
})
