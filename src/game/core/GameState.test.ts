import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import { createInitialGameState, updateGameState } from './GameState'

const NO_INPUT = {
  forward: false,
  turnLeft: false,
  turnRight: false,
  fireFront: false,
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
      { forward: true, turnLeft: false, turnRight: true, fireFront: false },
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
      { forward: false, turnLeft: true, turnRight: true, fireFront: false },
      1,
      GAME_CONFIG,
    )

    expect(nextState.player.rotation).toBe(0)
  })

  it('fires one front projectile in the direction the player is facing', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, fireFront: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    expect(nextState.projectiles).toHaveLength(1)
    expect(nextState.projectiles[0]).toMatchObject({
      id: 1,
      direction: 0,
      speed: GAME_CONFIG.frontCannon.projectileSpeed,
      damage: GAME_CONFIG.frontCannon.projectileDamage,
      owner: 'player',
    })
    expect(nextState.projectiles[0]?.x).toBe(state.player.x)
    expect(nextState.projectiles[0]?.y).toBe(
      state.player.y - GAME_CONFIG.frontCannon.spawnOffset,
    )
  })

  it('moves projectiles using their speed and direction', () => {
    const firedState = updateGameState(
      createInitialGameState(GAME_CONFIG),
      { ...NO_INPUT, fireFront: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )
    const projectileBeforeMovement = firedState.projectiles[0]

    const nextState = updateGameState(
      firedState,
      NO_INPUT,
      0.1,
      GAME_CONFIG,
    )

    expect(nextState.projectiles[0]?.y).toBeCloseTo(
      (projectileBeforeMovement?.y ?? 0) -
        GAME_CONFIG.frontCannon.projectileSpeed * 0.1,
    )
  })

  it('does not fire again while the front cannon is cooling down', () => {
    const firedState = updateGameState(
      createInitialGameState(GAME_CONFIG),
      { ...NO_INPUT, fireFront: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    const nextState = updateGameState(
      firedState,
      { ...NO_INPUT, fireFront: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    expect(nextState.projectiles).toHaveLength(1)
    expect(nextState.frontCannonCooldownRemaining).toBeGreaterThan(0)
  })

  it('removes a projectile when its lifetime expires', () => {
    const stationaryProjectileConfig = {
      ...GAME_CONFIG,
      frontCannon: {
        ...GAME_CONFIG.frontCannon,
        projectileSpeed: 0,
      },
    }
    const firedState = updateGameState(
      createInitialGameState(stationaryProjectileConfig),
      { ...NO_INPUT, fireFront: true },
      stationaryProjectileConfig.loop.fixedStepSeconds,
      stationaryProjectileConfig,
    )

    const nextState = updateGameState(
      firedState,
      NO_INPUT,
      stationaryProjectileConfig.frontCannon.projectileLifetimeSeconds,
      stationaryProjectileConfig,
    )

    expect(nextState.projectiles).toHaveLength(0)
  })
})
