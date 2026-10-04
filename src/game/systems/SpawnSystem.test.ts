import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import {
  getEnemyTypeForSpawn,
  spawnInitialEnemy,
  updateSpawning,
} from './SpawnSystem'

describe('SpawnSystem', () => {
  it('starts with a Chaser and creates a Shooter after the configured interval', () => {
    const player = { x: 640, y: 360 }
    const initialSpawn = spawnInitialEnemy(player, GAME_CONFIG)

    expect(initialSpawn.enemies).toHaveLength(1)
    expect(initialSpawn.enemies[0]).toMatchObject({ id: 1, type: 'chaser' })

    const beforeInterval = updateSpawning(
      initialSpawn.enemies,
      initialSpawn.spawnState,
      player,
      GAME_CONFIG.spawn.intervalSeconds - 0.01,
      GAME_CONFIG,
    )
    expect(beforeInterval.enemies).toHaveLength(1)

    const secondSpawn = updateSpawning(
      beforeInterval.enemies,
      beforeInterval.spawnState,
      player,
      0.01,
      GAME_CONFIG,
    )
    expect(secondSpawn.enemies).toHaveLength(2)
    expect(secondSpawn.enemies[1]).toMatchObject({
      id: 2,
      type: 'shooter',
      x: 1_160,
      y: 120,
    })
  })

  it('uses a repeatable two-Chaser, one-Shooter weighted cycle after both guaranteed spawns', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(getEnemyTypeForSpawn)).toEqual([
      'chaser',
      'shooter',
      'chaser',
      'chaser',
      'shooter',
      'chaser',
      'chaser',
    ])
  })

  it('skips spawn candidates inside land, too close to the player, or outside the arena', () => {
    const config = {
      ...GAME_CONFIG,
      spawn: {
        ...GAME_CONFIG.spawn,
        positions: [
          { x: 850, y: 250 },
          { x: 650, y: 360 },
          { x: 10, y: 10 },
          { x: 120, y: 120 },
        ],
      },
    }

    const result = spawnInitialEnemy({ x: 640, y: 360 }, config)

    expect(result.enemies).toHaveLength(1)
    expect(result.enemies[0]).toMatchObject({ x: 120, y: 120 })
  })
})
