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

test('keeps the player inside the arena and preserves state on resize', async ({
  page,
}) => {
  await startGame(page)

  await page.keyboard.down('w')
  await page.waitForTimeout(2_000)
  await page.keyboard.up('w')

  const boundaryState = await readGameState(page)
  expect(boundaryState.player.y).toBeCloseTo(52, 1)

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
