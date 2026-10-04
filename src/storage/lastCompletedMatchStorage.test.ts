import { describe, expect, it } from 'vitest'
import type { MatchRecord } from '../api/types'
import {
  clearLastCompletedMatch,
  LAST_COMPLETED_MATCH_STORAGE_KEY,
  loadLastCompletedMatch,
  saveLastCompletedMatch,
} from './lastCompletedMatchStorage'

const MATCH: MatchRecord = {
  matchId: 'last-match',
  playerId: 'player-1',
  playerName: 'Captain Test',
  score: 7,
  durationSeconds: 91,
  endReason: 'player_destroyed',
  completedAt: '2026-10-04T12:00:00.000Z',
  configKey: 'v1:duration=120:spawn=5',
  configuration: {
    sessionDurationSeconds: 120,
    enemySpawnIntervalSeconds: 5,
  },
}

function createStorage() {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  }
}

describe('last completed match storage', () => {
  it('persists and restores a valid completed match', () => {
    const storage = createStorage()

    saveLastCompletedMatch(MATCH, storage)

    expect(loadLastCompletedMatch(storage)).toEqual(MATCH)
  })

  it('ignores malformed stored data', () => {
    const storage = createStorage()
    storage.setItem(LAST_COMPLETED_MATCH_STORAGE_KEY, '{bad json')

    expect(loadLastCompletedMatch(storage)).toBeNull()
  })

  it('clears the stored result', () => {
    const storage = createStorage()
    saveLastCompletedMatch(MATCH, storage)

    clearLastCompletedMatch(storage)

    expect(loadLastCompletedMatch(storage)).toBeNull()
  })
})
