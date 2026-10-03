import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import { createInitialGameState, updateGameState } from './GameState'

const NO_INPUT = {
  forward: false,
  turnLeft: false,
  turnRight: false,
}

describe('updateGameState', () => {
  it('moves the player forward using units per second', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, forward: true },
      0.5,
      GAME_CONFIG,
    )

    expect(nextState.player.x).toBe(state.player.x)
    expect(nextState.player.y).toBe(
      state.player.y - GAME_CONFIG.player.movementSpeed * 0.5,
    )
  })

  it('rotates right using radians per second', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, turnRight: true },
      0.25,
      GAME_CONFIG,
    )

    expect(nextState.player.rotation).toBeCloseTo(Math.PI / 4)
  })

  it('supports moving and rotating at the same time', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      { forward: true, turnLeft: false, turnRight: true },
      0.25,
      GAME_CONFIG,
    )

    expect(nextState.player.rotation).toBeCloseTo(Math.PI / 4)
    expect(nextState.player.x).toBeGreaterThan(state.player.x)
    expect(nextState.player.y).toBeLessThan(state.player.y)
  })

  it('keeps the player inside the logical arena', () => {
    const radius = GAME_CONFIG.player.boundaryRadius
    const state = createInitialGameState(GAME_CONFIG)
    state.player.y = radius

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, forward: true },
      1,
      GAME_CONFIG,
    )

    expect(nextState.player.y).toBe(radius)
  })

  it('cancels rotation when left and right are pressed together', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      { forward: false, turnLeft: true, turnRight: true },
      1,
      GAME_CONFIG,
    )

    expect(nextState.player.rotation).toBe(0)
  })
})
