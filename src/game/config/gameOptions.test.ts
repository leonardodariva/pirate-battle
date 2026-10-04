import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from './gameConfig'
import {
  createMatchConfig,
  DEFAULT_GAME_OPTIONS,
  validateGameOptions,
} from './gameOptions'

describe('game options', () => {
  it('accepts the documented duration and spawn limits', () => {
    expect(
      validateGameOptions({
        sessionDurationSeconds: 60,
        enemySpawnIntervalSeconds: 1,
      }),
    ).toEqual({})
    expect(
      validateGameOptions({
        sessionDurationSeconds: 180,
        enemySpawnIntervalSeconds: 20,
      }),
    ).toEqual({})
  })

  it('rejects values outside the documented limits and decimals', () => {
    expect(
      validateGameOptions({
        sessionDurationSeconds: 59,
        enemySpawnIntervalSeconds: 20.5,
      }),
    ).toEqual({
      sessionDurationSeconds: expect.any(String),
      enemySpawnIntervalSeconds: expect.any(String),
    })
  })

  it('creates a match snapshot without changing the base configuration', () => {
    const options = {
      sessionDurationSeconds: 90,
      enemySpawnIntervalSeconds: 3,
    }
    const matchConfig = createMatchConfig(GAME_CONFIG, options)

    options.sessionDurationSeconds = 180
    options.enemySpawnIntervalSeconds = 20

    expect(matchConfig.match.sessionDurationSeconds).toBe(90)
    expect(matchConfig.spawn.intervalSeconds).toBe(3)
    expect(GAME_CONFIG.match.sessionDurationSeconds).toBe(
      DEFAULT_GAME_OPTIONS.sessionDurationSeconds,
    )
    expect(GAME_CONFIG.spawn.intervalSeconds).toBe(
      DEFAULT_GAME_OPTIONS.enemySpawnIntervalSeconds,
    )
  })
})
