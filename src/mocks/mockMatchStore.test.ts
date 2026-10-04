import { describe, expect, it } from 'vitest'
import type { MatchRecord } from '../api/types'
import {
  CONFIRMED_MATCHES_STORAGE_KEY,
  readConfirmedMatches,
  registerMatch,
} from './mockMatchStore'

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

const match: MatchRecord = {
  matchId: 'same-match-id',
  playerId: 'player-1',
  playerName: 'Captain',
  score: 12,
  durationSeconds: 120,
  endReason: 'timeout',
  completedAt: '2026-10-04T12:00:00Z',
  configKey: 'v1:duration=120:spawn=5',
  configuration: {
    sessionDurationSeconds: 120,
    enemySpawnIntervalSeconds: 5,
  },
}

describe('mock match store', () => {
  it('persists a new confirmed match', () => {
    const storage = createMemoryStorage()

    expect(registerMatch(match, storage).created).toBe(true)
    expect(readConfirmedMatches(storage)).toEqual([match])
  })

  it('returns the original match when the same matchId is retried', () => {
    const storage = createMemoryStorage()
    registerMatch(match, storage)
    const retry = registerMatch({ ...match, score: 999 }, storage)

    expect(retry).toEqual({ match, created: false })
    expect(readConfirmedMatches(storage)).toHaveLength(1)
  })

  it('uses one stable storage key', () => {
    expect(CONFIRMED_MATCHES_STORAGE_KEY).toBe(
      'pirate-battle:mock-confirmed-matches',
    )
  })
})
