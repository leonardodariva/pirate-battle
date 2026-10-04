import { expect, test, type Page } from '@playwright/test'
import type { GameTestSnapshot } from '../../src/game/testing/GameTestBridge'

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
  await expect(page.getByLabel('Game controls')).toBeVisible()

  const state = await readGameState(page)
  expect(state.player.x).toBe(640)
  expect(state.player.y).toBe(360)
  expect(state.player.rotation).toBe(0)
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

test('fires the front cannon through real keyboard input', async ({ page }) => {
  await startGame(page)
  const initialState = await readGameState(page)

  await page.keyboard.press('Space')
  await page.waitForFunction(
    () => (window.__GAME_TEST__?.getState().projectiles.length ?? 0) === 1,
  )

  const firedState = await readGameState(page)
  expect(firedState.projectiles).toHaveLength(1)
  expect(firedState.projectiles[0]?.owner).toBe('player')
  expect(firedState.projectiles[0]?.y).toBeLessThan(initialState.player.y)
})

test('fires three projectiles from each broadside', async ({ page }) => {
  await startGame(page)

  await page.keyboard.press('q')
  await page.waitForFunction(
    () => (window.__GAME_TEST__?.getState().projectiles.length ?? 0) === 3,
  )

  const leftState = await readGameState(page)
  expect(leftState.projectiles).toHaveLength(3)
  for (const projectile of leftState.projectiles) {
    expect(projectile.direction).toBeCloseTo(-Math.PI / 2)
  }

  await page.keyboard.press('e')
  await page.waitForFunction(
    () => (window.__GAME_TEST__?.getState().projectiles.length ?? 0) === 6,
  )

  const bothSidesState = await readGameState(page)
  expect(bothSidesState.projectiles).toHaveLength(6)
  for (const projectile of bothSidesState.projectiles.slice(3)) {
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
      state.projectiles.length === 1
    )
  })

  await page.keyboard.down('d')
  await page.waitForFunction(
    () => (window.__GAME_TEST__?.getState().player.rotation ?? 0) >= 1.4,
  )
  await page.keyboard.up('d')
  await page.keyboard.down('w')
  await page.waitForTimeout(1_000)
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
