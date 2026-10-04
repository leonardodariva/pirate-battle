import { expect, test } from '@playwright/test'

test('moves and fires at the same time with two touch pointers', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)

  const controls = page.getByLabel('Touch game controls')
  const joystick = page.getByLabel('Movement joystick')
  const fire = page.getByRole('button', { name: 'Fire front cannon' })
  await expect(controls).toBeVisible()

  const contextMenuWasBlocked = await controls.evaluate((element) => {
    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    })
    element.dispatchEvent(event)
    return event.defaultPrevented
  })
  expect(contextMenuWasBlocked).toBe(true)

  const initialY = await page.evaluate(
    () => window.__GAME_TEST__?.getState().player.y ?? 0,
  )
  const joystickBounds = await joystick.boundingBox()

  if (!joystickBounds) {
    throw new Error('The movement joystick has no visible bounds.')
  }

  const centerX = joystickBounds.x + joystickBounds.width / 2
  const centerY = joystickBounds.y + joystickBounds.height / 2

  await joystick.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: centerX,
    clientY: centerY,
  })
  await joystick.dispatchEvent('pointermove', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: centerX,
    clientY: centerY - joystickBounds.height / 2,
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

  await joystick.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    isPrimary: true,
    clientX: centerX,
    clientY: centerY - joystickBounds.height / 2,
  })

  const finalState = await page.evaluate(() => window.__GAME_TEST__?.getState())
  expect(finalState?.player.y).toBeLessThan(initialY - 20)
  expect(finalState?.frontCannonCooldownRemaining).toBeGreaterThan(0)
})
