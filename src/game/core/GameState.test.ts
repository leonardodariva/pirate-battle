import { describe, expect, it } from 'vitest'
import { GAME_CONFIG } from '../config/gameConfig'
import {
  createInitialGameState,
  updateGameState,
  type ProjectileState,
} from './GameState'

const NO_INPUT = {
  forward: false,
  turnLeft: false,
  turnRight: false,
  fireFront: false,
  fireLeftBroadside: false,
  fireRightBroadside: false,
}

describe('updateGameState', () => {
  it('moves the player forward using units per second', () => {
    const configWithoutIslands = { ...GAME_CONFIG, islands: [] }
    const state = createInitialGameState(configWithoutIslands)

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, forward: true },
      0.5,
      configWithoutIslands,
    )

    expect(nextState.player.x).toBe(state.player.x)
    expect(nextState.player.y).toBe(
      state.player.y - configWithoutIslands.player.movementSpeed * 0.5,
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
      {
        forward: true,
        turnLeft: false,
        turnRight: true,
        fireFront: false,
        fireLeftBroadside: false,
        fireRightBroadside: false,
      },
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

  it('blocks the colliding axis while allowing sliding and rotation', () => {
    const state = createInitialGameState(GAME_CONFIG)
    state.player.x = 759
    state.player.y = 300
    state.player.rotation = Math.PI / 2

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, forward: true, turnRight: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    expect(nextState.player.x).toBe(state.player.x)
    expect(nextState.player.y).toBeGreaterThan(state.player.y)
    expect(nextState.player.rotation).toBeGreaterThan(state.player.rotation)
  })

  it('does not rotate the ship hull into an island', () => {
    const state = createInitialGameState(GAME_CONFIG)
    state.player.x = 780
    state.player.y = 390
    state.player.rotation = Math.PI / 2

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, turnLeft: true },
      0.25,
      GAME_CONFIG,
    )

    expect(nextState.player.rotation).toBe(state.player.rotation)
  })

  it('cancels rotation when left and right are pressed together', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      {
        forward: false,
        turnLeft: true,
        turnRight: true,
        fireFront: false,
        fireLeftBroadside: false,
        fireRightBroadside: false,
      },
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

  it('removes a projectile when it hits an island', () => {
    const initialState = createInitialGameState(GAME_CONFIG)
    initialState.player.rotation = Math.PI / 2
    let state = updateGameState(
      initialState,
      { ...NO_INPUT, fireFront: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    for (let update = 0; update < 20; update += 1) {
      state = updateGameState(
        state,
        NO_INPUT,
        GAME_CONFIG.loop.fixedStepSeconds,
        GAME_CONFIG,
      )
    }

    expect(state.projectiles).toHaveLength(0)
  })

  it('fires three parallel projectiles from the left broadside', () => {
    const state = createInitialGameState(GAME_CONFIG)

    const nextState = updateGameState(
      state,
      { ...NO_INPUT, fireLeftBroadside: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    expect(nextState.projectiles).toHaveLength(3)
    expect(nextState.projectiles.map((projectile) => projectile.id)).toEqual([
      1, 2, 3,
    ])
    expect(
      nextState.projectiles.every(
        (projectile) => projectile.direction === -Math.PI / 2,
      ),
    ).toBe(true)
    expect(new Set(nextState.projectiles.map((projectile) => projectile.y)).size)
      .toBe(3)
  })

  it('keeps left and right broadside cooldowns independent', () => {
    const leftBroadsideState = updateGameState(
      createInitialGameState(GAME_CONFIG),
      { ...NO_INPUT, fireLeftBroadside: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )
    const repeatedLeftState = updateGameState(
      leftBroadsideState,
      { ...NO_INPUT, fireLeftBroadside: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )
    const rightBroadsideState = updateGameState(
      repeatedLeftState,
      { ...NO_INPUT, fireRightBroadside: true },
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    expect(repeatedLeftState.projectiles).toHaveLength(3)
    expect(rightBroadsideState.projectiles).toHaveLength(6)
    expect(rightBroadsideState.leftBroadsideCooldownRemaining).toBeGreaterThan(
      0,
    )
    expect(rightBroadsideState.rightBroadsideCooldownRemaining).toBeGreaterThan(
      0,
    )
    expect(rightBroadsideState.projectiles.slice(3)).toSatisfy(
      (projectiles: ProjectileState[]) =>
        projectiles.every(
          (projectile) => projectile.direction === Math.PI / 2,
        ),
    )
  })

  it('ends the match when the configured active time reaches zero', () => {
    const shortMatchConfig = {
      ...GAME_CONFIG,
      match: { sessionDurationSeconds: 0.1 },
      spawn: { ...GAME_CONFIG.spawn, intervalSeconds: 0.1 },
    }
    const state = createInitialGameState(shortMatchConfig)

    const endedState = updateGameState(
      state,
      NO_INPUT,
      0.1,
      shortMatchConfig,
    )

    expect(endedState.status).toBe('ended')
    expect(endedState.endReason).toBe('timeout')
    expect(endedState.elapsedTimeSeconds).toBe(0.1)
    expect(endedState.remainingTimeSeconds).toBe(0)
    expect(endedState.enemies).toHaveLength(1)
  })

  it('ends the match when a Chaser removes the player last health', () => {
    const state = createInitialGameState(GAME_CONFIG)
    state.player.health = GAME_CONFIG.chaser.collisionDamage
    state.enemies = [
      {
        id: 1,
        type: 'chaser',
        x: state.player.x,
        y: state.player.y,
        rotation: 0,
        health: GAME_CONFIG.chaser.maxHealth,
      },
    ]

    const endedState = updateGameState(
      state,
      NO_INPUT,
      GAME_CONFIG.loop.fixedStepSeconds,
      GAME_CONFIG,
    )

    expect(endedState.player.health).toBe(0)
    expect(endedState.status).toBe('ended')
    expect(endedState.endReason).toBe('player_destroyed')
  })

  it('returns the frozen state after the match has ended', () => {
    const state = createInitialGameState(GAME_CONFIG)
    state.status = 'ended'
    state.endReason = 'timeout'
    state.remainingTimeSeconds = 0

    const frozenState = updateGameState(
      state,
      { ...NO_INPUT, forward: true, fireFront: true },
      1,
      GAME_CONFIG,
    )

    expect(frozenState).toBe(state)
  })
})
