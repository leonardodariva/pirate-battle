import type { MatchRecord } from '../api/types'
import { isMatchRecord } from '../api/matchRecord'

export { isMatchRecord } from '../api/matchRecord'

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
