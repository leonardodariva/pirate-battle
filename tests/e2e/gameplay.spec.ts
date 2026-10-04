import { expect, test, type Page } from '@playwright/test'
import type { GameTestSnapshot } from '../../src/game/testing/GameTestBridge'
import { GAME_OPTIONS_STORAGE_KEY } from '../../src/storage/gameOptionsStorage'

async function startGame(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)
  await expect(page.locator('canvas')).toHaveCount(1)
}

async function readGameState(page: Page): Promise<GameTestSnapshot> {
  return page.evaluate(() => {
    if (!window.__GAME_TEST__) {
      throw new Error('Game test bridge is not available.')
    }

    return window.__GAME_TEST__.getState()
  })
}

test('starts a match and loads one PixiJS canvas', async ({ page }) => {
  await page.goto('/')

  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)

  await expect(page.locator('canvas')).toHaveCount(1)
  await expect(page.getByLabel('Game controls', { exact: true })).toBeVisible()

  const state = await readGameState(page)
  expect(state.player.x).toBe(640)
  expect(state.player.y).toBe(360)
  expect(state.player.rotation).toBe(0)
})

test('opens the controls guide and returns to the menu', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Controls' }).click()

  await expect(
    page.getByRole('heading', { name: 'Controls' }),
  ).toBeVisible()
  await expect(page.getByText('Move forward', { exact: true })).toBeVisible()
  await expect(page.getByText('Joystick direction')).toBeVisible()
  await expect(
    page.getByText('Use the joystick and a weapon button'),
  ).toBeVisible()

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('loads and paginates the ranking through the mocked API', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Ranking' }).click()

  await expect(page.getByRole('heading', { name: 'Ranking' })).toBeVisible()
  await expect(page.getByRole('row').nth(1)).toContainText('Storm Jane')
  await expect(page.getByRole('row').nth(1)).toContainText('42')
  await expect(page.getByText('Page 1 of 3')).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Page 2 of 3')).toBeVisible()
  await expect(page.getByRole('row').nth(1)).toContainText('Reef Runner')

  await page.getByRole('button', { name: 'Previous' }).click()
  await expect(page.getByText('Page 1 of 3')).toBeVisible()
})

test('loads the current player match history and paginates it', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Match history' }).click()

  await expect(
    page.getByRole('heading', { name: 'Match History' }),
  ).toBeVisible()
  await expect(page.getByRole('row').nth(1)).toContainText('Oct 3, 2026')
  await expect(page.getByRole('row').nth(1)).toContainText('Time up')
  await expect(page.getByRole('row').nth(2)).toContainText('Ship destroyed')
  await expect(page.getByText('Page 1 of 2')).toBeVisible()

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  await expect(page.getByRole('row').nth(1)).toContainText('Sep 28, 2026')

  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()
})

test('validates, persists, and snapshots gameplay options', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Options' }).click()

  const durationInput = page.getByLabel('Game session time')
  const spawnInput = page.getByLabel('Enemy spawn time')
  await durationInput.fill('59')
  await spawnInput.fill('0')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('alert')).toHaveCount(2)
  await durationInput.fill('90')
  await spawnInput.fill('3')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(
    page.getByRole('heading', { name: 'Pirate Battle' }),
  ).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Options' }).click()
  await expect(page.getByLabel('Game session time')).toHaveValue('90')
  await expect(page.getByLabel('Enemy spawn time')).toHaveValue('3')

  await page.getByRole('button', { name: 'Back' }).click()
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)

  const initialState = await readGameState(page)
  expect(initialState.config).toEqual({
    sessionDurationSeconds: 90,
    enemySpawnIntervalSeconds: 3,
  })
  await page.evaluate(
    ({ key }) => {
      window.localStorage.setItem(
        key,
        JSON.stringify({
          sessionDurationSeconds: 180,
          enemySpawnIntervalSeconds: 20,
        }),
      )
    },
    { key: GAME_OPTIONS_STORAGE_KEY },
  )

  const unchangedMatchState = await readGameState(page)
  expect(unchangedMatchState.config).toEqual(initialState.config)
})

test('spawns the guaranteed Chaser first and Shooter second', async ({ page }) => {
  await startGame(page)

  const initialState = await readGameState(page)
  expect(initialState.enemies).toHaveLength(1)
  expect(initialState.enemies[0]?.type).toBe('chaser')

  await page.waitForFunction(() =>
    window.__GAME_TEST__
      ?.getState()
      .enemies.some((enemy) => enemy.type === 'shooter'),
  )

  const spawnedState = await readGameState(page)
  expect(spawnedState.enemies[1]).toMatchObject({ id: 2, type: 'shooter' })
})

test('ends by timeout, freezes the match, and restarts cleanly', async ({ page }) => {
  await startGame(page)
  await page.evaluate(() => window.__GAME_TEST__?.setRemainingTime(0.05))

  await expect(
    page.getByRole('heading', { name: 'Time is up!' }),
  ).toBeVisible()

  const endedState = await readGameState(page)
  expect(endedState.status).toBe('ended')
  expect(endedState.endReason).toBe('timeout')
  expect(endedState.remainingTimeSeconds).toBe(0)

  await page.getByRole('button', { name: 'Play again' }).click()
  await page.waitForFunction(() => {
    const state = window.__GAME_TEST__?.getState()
    return state?.status === 'running' && state.remainingTimeSeconds > 119
  })

  const restartedState = await readGameState(page)
  expect(restartedState.player.health).toBe(100)
  expect(restartedState.score).toBe(0)
  expect(restartedState.enemies).toHaveLength(1)
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('ends the match when enemy damage destroys the player', async ({ page }) => {
  await startGame(page)
  await page.evaluate(() => {
    window.__GAME_TEST__?.setPlayerHealth(10)
    window.__GAME_TEST__?.placeShooter({
      x: 640,
      y: 600,
      rotation: 0,
      health: 3,
    })
  })

  await expect(
    page.getByRole('heading', { name: 'Your ship was destroyed!' }),
  ).toBeVisible()

  const endedState = await readGameState(page)
  expect(endedState.status).toBe('ended')
  expect(endedState.endReason).toBe('player_destroyed')
  expect(endedState.player.health).toBe(0)
})

test('pauses with Escape, freezes simulation, and clears queued input', async ({
  page,
}) => {
  await startGame(page)
  await page.keyboard.press('Escape')

  await expect(
    page.getByRole('heading', { name: 'The battle is paused' }),
  ).toBeVisible()
  const pausedState = await readGameState(page)
  expect(pausedState.status).toBe('paused')

  await page.keyboard.down('w')
  await page.keyboard.press('Space')
  await page.waitForTimeout(300)
  await page.keyboard.up('w')

  const stillPausedState = await readGameState(page)
  expect(stillPausedState.player).toEqual(pausedState.player)
  expect(stillPausedState.remainingTimeSeconds).toBe(
    pausedState.remainingTimeSeconds,
  )
  expect(stillPausedState.projectiles).toEqual(pausedState.projectiles)

  await page.keyboard.press('Escape')
  await page.waitForFunction(
    (pausedTime) => {
      const state = window.__GAME_TEST__?.getState()
      return (
        state?.status === 'running' &&
        state.remainingTimeSeconds < pausedTime - 0.1
      )
    },
    pausedState.remainingTimeSeconds,
  )

  const resumedState = await readGameState(page)
  expect(resumedState.projectiles).toEqual(pausedState.projectiles)
})

test('pauses on blur and requires an explicit Continue action', async ({
  page,
}) => {
  await startGame(page)
  await page.evaluate(() => window.dispatchEvent(new Event('blur')))

  await expect(page.getByText('Focus lost')).toBeVisible()
  const pausedState = await readGameState(page)
  expect(pausedState.status).toBe('paused')

  await page.evaluate(() => window.dispatchEvent(new Event('focus')))
  await page.waitForTimeout(300)

  const focusedState = await readGameState(page)
  expect(focusedState.status).toBe('paused')
  expect(focusedState.remainingTimeSeconds).toBe(
    pausedState.remainingTimeSeconds,
  )

  await page.getByRole('button', { name: 'Continue' }).click()
  await page.waitForFunction(
    () => window.__GAME_TEST__?.getState().status === 'running',
  )
})

test('moves and rotates through real keyboard input', async ({ page }) => {
  await startGame(page)
  const initialState = await readGameState(page)

  await page.keyboard.down('w')
  await page.waitForTimeout(350)
  await page.keyboard.up('w')

  const movedState = await readGameState(page)
  expect(movedState.player.x).toBeCloseTo(initialState.player.x, 1)
  expect(movedState.player.y).toBeLessThan(initialState.player.y - 20)

  await page.keyboard.down('d')
  await page.waitForTimeout(250)
  await page.keyboard.up('d')

  const rotatedState = await readGameState(page)
  expect(rotatedState.player.rotation).toBeGreaterThan(0.2)
})

test('moves the chaser toward the player', async ({ page }) => {
  await startGame(page)
  const initialState = await readGameState(page)
  const initialEnemy = initialState.enemies[0]

  expect(initialEnemy?.type).toBe('chaser')
  if (!initialEnemy) {
    throw new Error('The initial chaser was not created.')
  }

  const initialDistance = Math.hypot(
    initialState.player.x - initialEnemy.x,
    initialState.player.y - initialEnemy.y,
  )

  await page.waitForFunction(
    ({ enemyId, distance }) => {
      const state = window.__GAME_TEST__?.getState()
      const enemy = state?.enemies.find((candidate) => candidate.id === enemyId)

      if (!state || !enemy) {
        return false
      }

      return (
        Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y) <
        distance - 20
      )
    },
    { enemyId: initialEnemy.id, distance: initialDistance },
  )

  const chasedState = await readGameState(page)
  expect(chasedState.enemies[0]?.rotation).not.toBe(0)
})

test('routes the chaser around the island instead of crossing it', async ({
  page,
}) => {
  await startGame(page)
  await page.evaluate(() => {
    window.__GAME_TEST__?.placePlayer({
      x: 1_150,
      y: 276,
      rotation: 0,
    })
    window.__GAME_TEST__?.placeChaser({
      x: 700,
      y: 276,
      rotation: Math.PI / 2,
      health: 3,
    })
  })

  await page.waitForFunction(() => {
    const enemy = window.__GAME_TEST__?.getState().enemies[0]
    return enemy !== undefined && enemy.x > 1_005
  }, undefined, { timeout: 10_000 })

  const routedState = await readGameState(page)
  const enemyY = routedState.enemies[0]?.y ?? 276
  expect(enemyY < 167 || enemyY > 373).toBe(true)
})

test('applies chaser collision damage once without awarding score', async ({
  page,
}) => {
  await startGame(page)
  await page.evaluate(() => {
    window.__GAME_TEST__?.placeChaser({
      x: 640,
      y: 250,
      rotation: Math.PI,
      health: 3,
    })
  })

  await page.waitForFunction(
    () =>
      window.__GAME_TEST__
        ?.getState()
        .enemies.every((enemy) => enemy.type !== 'chaser') ?? false,
  )

  const collisionState = await readGameState(page)
  expect(collisionState.player.health).toBe(75)
  expect(collisionState.score).toBe(0)
})

test('keeps the shooter at range and damages the player with a real shot', async ({
  page,
}) => {
  await startGame(page)
  await page.evaluate(() => {
    window.__GAME_TEST__?.placeShooter({
      x: 640,
      y: 600,
      rotation: 0,
      health: 3,
    })
  })

  await page.waitForFunction(() => {
    const state = window.__GAME_TEST__?.getState()
    return state !== undefined && state.player.health === 90
  })

  const hitState = await readGameState(page)
  const shooter = hitState.enemies.find((enemy) => enemy.type === 'shooter')
  expect(shooter?.y).toBeCloseTo(600, 1)
  expect(hitState.score).toBe(0)
})

test('damages and scores a chaser kill with a real projectile', async ({
  page,
}) => {
  await startGame(page)
  await page.evaluate(() => {
    window.__GAME_TEST__?.placeChaser({
      x: 640,
      y: 250,
      rotation: Math.PI,
      health: 1,
    })
  })

  await page.keyboard.press('Space')
  await page.waitForFunction(() => {
    const state = window.__GAME_TEST__?.getState()
    return state?.score === 1 && state.enemies.length === 0
  })

  const defeatedState = await readGameState(page)
  expect(defeatedState.player.health).toBe(100)
  expect(defeatedState.projectiles).toHaveLength(0)
})

test('fires the front cannon through real keyboard input', async ({ page }) => {
  await startGame(page)
  const initialState = await readGameState(page)

  await page.keyboard.press('Space')
  await page.waitForFunction(
    () =>
      window.__GAME_TEST__
        ?.getState()
        .projectiles.filter((projectile) => projectile.owner === 'player')
        .length === 1,
  )

  const firedState = await readGameState(page)
  const playerProjectiles = firedState.projectiles.filter(
    (projectile) => projectile.owner === 'player',
  )
  expect(playerProjectiles).toHaveLength(1)
  expect(playerProjectiles[0]?.y).toBeLessThan(initialState.player.y)
})

test('fires three projectiles from each broadside', async ({ page }) => {
  await startGame(page)

  await page.keyboard.press('q')
  await page.waitForFunction(
    () =>
      window.__GAME_TEST__
        ?.getState()
        .projectiles.filter((projectile) => projectile.owner === 'player')
        .length === 3,
  )

  const leftState = await readGameState(page)
  const leftProjectiles = leftState.projectiles.filter(
    (projectile) => projectile.owner === 'player',
  )
  expect(leftProjectiles).toHaveLength(3)
  for (const projectile of leftProjectiles) {
    expect(projectile.direction).toBeCloseTo(-Math.PI / 2)
  }

  await startGame(page)
  await page.keyboard.press('e')
  await page.waitForFunction(
    () =>
      window.__GAME_TEST__
        ?.getState()
        .projectiles.filter((projectile) => projectile.owner === 'player')
        .length === 3,
  )

  const rightState = await readGameState(page)
  const rightProjectiles = rightState.projectiles.filter(
    (projectile) => projectile.owner === 'player',
  )
  expect(rightProjectiles).toHaveLength(3)
  for (const projectile of rightProjectiles) {
    expect(projectile.direction).toBeCloseTo(Math.PI / 2)
  }
})

test('blocks the player and projectiles at the island', async ({ page }) => {
  await startGame(page)

  await page.keyboard.press('e')
  await page.waitForFunction(() => {
    const state = window.__GAME_TEST__?.getState()
    return (
      state !== undefined &&
      state.rightBroadsideCooldownRemaining > 0 &&
      state.projectiles.filter((projectile) => projectile.owner === 'player')
        .length === 1
    )
  })

  await page.evaluate(() => {
    window.__GAME_TEST__?.placePlayer({
      x: 700,
      y: 276,
      rotation: Math.PI / 2,
    })
  })
  await page.keyboard.down('w')
  await page.waitForFunction(
    () => (window.__GAME_TEST__?.getState().player.x ?? 0) >= 756,
  )
  await page.keyboard.up('w')

  const blockedState = await readGameState(page)
  expect(blockedState.player.x).toBeGreaterThanOrEqual(756)
  expect(blockedState.player.x).toBeLessThan(764)
})

test('keeps the player inside the arena and preserves state on resize', async ({
  page,
}) => {
  await startGame(page)

  await page.keyboard.down('a')
  await page.waitForTimeout(500)
  await page.keyboard.up('a')
  await page.keyboard.down('w')
  await page.waitForTimeout(3_000)
  await page.keyboard.up('w')

  const boundaryState = await readGameState(page)
  expect(boundaryState.player.x).toBeCloseTo(52, 1)

  await page.setViewportSize({ width: 900, height: 600 })
  await page.waitForTimeout(100)

  const resizedState = await readGameState(page)
  expect(resizedState.player.x).toBeCloseTo(boundaryState.player.x, 5)
  expect(resizedState.player.y).toBeCloseTo(boundaryState.player.y, 5)
  expect(resizedState.player.rotation).toBeCloseTo(
    boundaryState.player.rotation,
    5,
  )
})

test('destroys and recreates the game without duplicate canvases', async ({
  page,
}) => {
  await startGame(page)

  await page.getByRole('button', { name: 'Leave match' }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
  expect(await page.evaluate(() => window.__GAME_TEST__)).toBeUndefined()

  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)
  await expect(page.locator('canvas')).toHaveCount(1)

  const restartedState = await readGameState(page)
  expect(restartedState.player.x).toBe(640)
  expect(restartedState.player.y).toBe(360)
})
