import { describe, expect, it, vi } from 'vitest'
import {
  getOrCreatePlayerIdentity,
  PLAYER_IDENTITY_STORAGE_KEY,
} from './playerIdentityStorage'

function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue

  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, nextValue: string) => {
      value = nextValue
    }),
  }
}

describe('player identity storage', () => {
  it('creates and persists one identity when none exists', () => {
    const storage = createMemoryStorage()
    const identity = getOrCreatePlayerIdentity(storage, () => 'player-123')

    expect(identity).toEqual({
      playerId: 'player-123',
      playerName: 'Captain',
    })
    expect(storage.setItem).toHaveBeenCalledWith(
      PLAYER_IDENTITY_STORAGE_KEY,
      JSON.stringify(identity),
    )
  })

  it('reuses a valid stored identity without creating a new one', () => {
    const storedIdentity = {
      playerId: 'existing-player',
      playerName: 'Captain',
    }
    const storage = createMemoryStorage(JSON.stringify(storedIdentity))
    const createId = vi.fn(() => 'new-player')

    expect(getOrCreatePlayerIdentity(storage, createId)).toEqual(storedIdentity)
    expect(createId).not.toHaveBeenCalled()
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('replaces malformed stored data', () => {
    const storage = createMemoryStorage('{broken')

    expect(getOrCreatePlayerIdentity(storage, () => 'replacement')).toEqual({
      playerId: 'replacement',
      playerName: 'Captain',
    })
    expect(storage.setItem).toHaveBeenCalledOnce()
  })
})
