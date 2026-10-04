import {
  areGameOptionsValid,
  DEFAULT_GAME_OPTIONS,
  type GameOptions,
} from '../game/config/gameOptions'

export const GAME_OPTIONS_STORAGE_KEY = 'pirate-battle:game-options'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function loadGameOptions(
  storage: StorageLike = window.localStorage,
): GameOptions {
  try {
    const storedValue = storage.getItem(GAME_OPTIONS_STORAGE_KEY)

    if (!storedValue) {
      return { ...DEFAULT_GAME_OPTIONS }
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (!isGameOptions(parsedValue) || !areGameOptionsValid(parsedValue)) {
      return { ...DEFAULT_GAME_OPTIONS }
    }

    return parsedValue
  } catch {
    return { ...DEFAULT_GAME_OPTIONS }
  }
}

export function saveGameOptions(
  options: GameOptions,
  storage: StorageLike = window.localStorage,
) {
  storage.setItem(GAME_OPTIONS_STORAGE_KEY, JSON.stringify(options))
}

function isGameOptions(value: unknown): value is GameOptions {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.sessionDurationSeconds === 'number' &&
    typeof candidate.enemySpawnIntervalSeconds === 'number'
  )
}
