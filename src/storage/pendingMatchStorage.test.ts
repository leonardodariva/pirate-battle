import { describe, expect, it } from 'vitest'
import type { MatchRecord } from '../api/types'
import {
  loadPendingMatches,
  PENDING_MATCHES_STORAGE_KEY,
  removePendingMatch,
  savePendingMatch,
} from './pendingMatchStorage'

function createMemoryStorage() {
  const values = new Map<string, string>()

  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  }
}

const match: MatchRecord = {
  matchId: 'pending-match',
  playerId: 'player-1',
  playerName: 'Captain',
  score: 4,
  durationSeconds: 45,
  endReason: 'player_destroyed',
  completedAt: '2026-10-04T12:00:00Z',
  configKey: 'v1:duration=120:spawn=5',
  configuration: {
    sessionDurationSeconds: 120,
    enemySpawnIntervalSeconds: 5,
  },
}

describe('pending match storage', () => {
  it('persists a failed match', () => {
    const storage = createMemoryStorage()

    savePendingMatch(match, storage)

    expect(loadPendingMatches(storage)).toEqual([match])
  })

  it('updates instead of duplicating the same matchId', () => {
    const storage = createMemoryStorage()
    savePendingMatch(match, storage)
    savePendingMatch({ ...match, score: 9 }, storage)

    expect(loadPendingMatches(storage)).toEqual([{ ...match, score: 9 }])
  })

  it('removes only the confirmed match', () => {
    const storage = createMemoryStorage()
    savePendingMatch(match, storage)
    savePendingMatch({ ...match, matchId: 'another-match' }, storage)

    expect(removePendingMatch(match.matchId, storage)).toEqual([
      { ...match, matchId: 'another-match' },
    ])
  })

  it('uses one stable storage key', () => {
    expect(PENDING_MATCHES_STORAGE_KEY).toBe('pirate-battle:pending-matches')
  })
})
