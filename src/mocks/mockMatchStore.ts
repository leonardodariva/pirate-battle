import type { MatchRecord } from '../api/types'

export const CONFIRMED_MATCHES_STORAGE_KEY =
  'pirate-battle:mock-confirmed-matches'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function readConfirmedMatches(
  storage: StorageLike = window.localStorage,
): MatchRecord[] {
  try {
    const storedValue = storage.getItem(CONFIRMED_MATCHES_STORAGE_KEY)
    if (!storedValue) {
      return []
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    return Array.isArray(parsedValue) && parsedValue.every(isMatchRecord)
      ? parsedValue
      : []
  } catch {
    return []
  }
}

export function registerMatch(
  match: MatchRecord,
  storage: StorageLike = window.localStorage,
) {
  const matches = readConfirmedMatches(storage)
  const existingMatch = matches.find(
    (candidate) => candidate.matchId === match.matchId,
  )

  if (existingMatch) {
    return { match: existingMatch, created: false }
  }

  storage.setItem(
    CONFIRMED_MATCHES_STORAGE_KEY,
    JSON.stringify([...matches, match]),
  )
  return { match, created: true }
}

export function isMatchRecord(value: unknown): value is MatchRecord {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const configuration = candidate.configuration

  return (
    typeof candidate.matchId === 'string' &&
    candidate.matchId.length > 0 &&
    typeof candidate.playerId === 'string' &&
    candidate.playerId.length > 0 &&
    typeof candidate.playerName === 'string' &&
    candidate.playerName.length > 0 &&
    typeof candidate.score === 'number' &&
    typeof candidate.durationSeconds === 'number' &&
    (candidate.endReason === 'timeout' ||
      candidate.endReason === 'player_destroyed') &&
    typeof candidate.completedAt === 'string' &&
    typeof candidate.configKey === 'string' &&
    typeof configuration === 'object' &&
    configuration !== null &&
    typeof (configuration as Record<string, unknown>)
      .sessionDurationSeconds === 'number' &&
    typeof (configuration as Record<string, unknown>)
      .enemySpawnIntervalSeconds === 'number'
  )
}
