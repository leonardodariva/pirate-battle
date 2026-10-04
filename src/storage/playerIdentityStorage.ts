export interface PlayerIdentity {
  playerId: string
  playerName: string
}

export const PLAYER_IDENTITY_STORAGE_KEY = 'pirate-battle:player-identity'

interface StorageLike {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
}

export function getOrCreatePlayerIdentity(
  storage: StorageLike = window.localStorage,
  createId: () => string = () => crypto.randomUUID(),
): PlayerIdentity {
  try {
    const storedValue = storage.getItem(PLAYER_IDENTITY_STORAGE_KEY)

    if (storedValue) {
      const parsedValue: unknown = JSON.parse(storedValue)

      if (isPlayerIdentity(parsedValue)) {
        return parsedValue
      }
    }
  } catch {
    // A malformed value is safely replaced below.
  }

  const identity = {
    playerId: createId(),
    playerName: 'Captain',
  }

  storage.setItem(PLAYER_IDENTITY_STORAGE_KEY, JSON.stringify(identity))
  return identity
}

function isPlayerIdentity(value: unknown): value is PlayerIdentity {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.playerId === 'string' &&
    candidate.playerId.length > 0 &&
    typeof candidate.playerName === 'string' &&
    candidate.playerName.length > 0
  )
}
