import type { MatchRecord } from '../api/types'
import { isMatchRecord } from '../api/matchRecord'

export const LAST_COMPLETED_MATCH_STORAGE_KEY =
  'pirate-battle:last-completed-match'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

export function loadLastCompletedMatch(
  storage: StorageLike = window.localStorage,
): MatchRecord | null {
  try {
    const storedValue = storage.getItem(LAST_COMPLETED_MATCH_STORAGE_KEY)

    if (!storedValue) {
      return null
    }

    const parsedValue: unknown = JSON.parse(storedValue)
    return isMatchRecord(parsedValue) ? parsedValue : null
  } catch {
    return null
  }
}

export function saveLastCompletedMatch(
  match: MatchRecord,
  storage: StorageLike = window.localStorage,
) {
  storage.setItem(LAST_COMPLETED_MATCH_STORAGE_KEY, JSON.stringify(match))
}

export function clearLastCompletedMatch(
  storage: StorageLike = window.localStorage,
) {
  storage.removeItem(LAST_COMPLETED_MATCH_STORAGE_KEY)
}
