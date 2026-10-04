import { expect, test } from '@playwright/test'

test('moves and fires at the same time with two touch pointers', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)

  const controls = page.getByLabel('Touch game controls')
  const forward = page.getByRole('button', { name: 'Move forward' })
  const fire = page.getByRole('button', { name: 'Fire front cannon' })
  await expect(controls).toBeVisible()

  const initialY = await page.evaluate(
    () => window.__GAME_TEST__?.getState().player.y ?? 0,
  )

  await forward.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
  })
  await fire.dispatchEvent('pointerdown', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: false,
  })
  await fire.dispatchEvent('pointerup', {
    pointerId: 2,
    pointerType: 'touch',
    isPrimary: false,
  })

  await page.waitForFunction(
    (startingY) => {
      const state = window.__GAME_TEST__?.getState()
      return (
        state !== undefined &&
        state.player.y < startingY - 20 &&
        state.frontCannonCooldownRemaining > 0
      )
    },
    initialY,
  )

  await forward.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
  })

  const finalState = await page.evaluate(() => window.__GAME_TEST__?.getState())
  expect(finalState?.player.y).toBeLessThan(initialY - 20)
  expect(finalState?.frontCannonCooldownRemaining).toBeGreaterThan(0)
})
