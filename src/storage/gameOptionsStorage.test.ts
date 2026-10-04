import { describe, expect, it } from 'vitest'
import { DEFAULT_GAME_OPTIONS } from '../game/config/gameOptions'
import {
  GAME_OPTIONS_STORAGE_KEY,
  loadGameOptions,
  saveGameOptions,
} from './gameOptionsStorage'

function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue

  return {
    getItem: () => value,
    setItem: (_key: string, nextValue: string) => {
      value = nextValue
    },
  }
}

describe('game options storage', () => {
  it('saves and loads valid options', () => {
    const storage = createMemoryStorage()
    const options = {
      sessionDurationSeconds: 90,
      enemySpawnIntervalSeconds: 3,
    }

    saveGameOptions(options, storage)

    expect(loadGameOptions(storage)).toEqual(options)
  })

  it('uses defaults when stored JSON is malformed', () => {
    const storage = createMemoryStorage('{broken')

    expect(loadGameOptions(storage)).toEqual(DEFAULT_GAME_OPTIONS)
  })

  it('uses defaults when stored values are outside valid limits', () => {
    const storage = createMemoryStorage(
      JSON.stringify({
        sessionDurationSeconds: 10,
        enemySpawnIntervalSeconds: 0,
      }),
    )

    expect(loadGameOptions(storage)).toEqual(DEFAULT_GAME_OPTIONS)
  })

  it('uses one stable storage key', () => {
    expect(GAME_OPTIONS_STORAGE_KEY).toBe('pirate-battle:game-options')
  })
})
