import type { MatchRecord } from '../api/types'
import { isMatchRecord } from '../api/matchRecord'

export const PENDING_MATCHES_STORAGE_KEY = 'pirate-battle:pending-matches'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function loadPendingMatches(
  storage: StorageLike = window.localStorage,
): MatchRecord[] {
  try {
    const storedValue = storage.getItem(PENDING_MATCHES_STORAGE_KEY)
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

export function savePendingMatch(
  match: MatchRecord,
  storage: StorageLike = window.localStorage,
) {
  const pendingMatches = loadPendingMatches(storage)
  const existingIndex = pendingMatches.findIndex(
    (candidate) => candidate.matchId === match.matchId,
  )
  const nextMatches =
    existingIndex === -1
      ? [...pendingMatches, match]
      : pendingMatches.map((candidate, index) =>
          index === existingIndex ? match : candidate,
        )

  storage.setItem(PENDING_MATCHES_STORAGE_KEY, JSON.stringify(nextMatches))
  return nextMatches
}

export function removePendingMatch(
  matchId: string,
  storage: StorageLike = window.localStorage,
) {
  const nextMatches = loadPendingMatches(storage).filter(
    (match) => match.matchId !== matchId,
  )

  storage.setItem(PENDING_MATCHES_STORAGE_KEY, JSON.stringify(nextMatches))
  return nextMatches
}
