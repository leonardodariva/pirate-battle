import { expect, test } from '@playwright/test'

test('matches the main menu baseline', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Play' })).toBeVisible()

  await expect(page).toHaveScreenshot('main-menu.png', {
    animations: 'disabled',
  })
})

test('matches a stable arena baseline', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)
  await page.keyboard.press('Escape')
  await expect(
    page.getByRole('heading', { name: 'The battle is paused' }),
  ).toBeVisible()
  await page.addStyleTag({
    content: '.pause-dialog { display: none !important; }',
  })

  await expect(page.locator('.arena-panel')).toHaveScreenshot(
    'stable-arena.png',
    {
      animations: 'disabled',
      maxDiffPixelRatio: 0.002,
    },
  )
})

test('matches the completed result baseline', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Play' }).click()
  await page.waitForFunction(() => window.__GAME_TEST__ !== undefined)
  await page.evaluate(() => {
    window.__GAME_TEST__?.placeChaser({
      x: 160,
      y: 100,
      rotation: Math.PI,
      health: 3,
    })
    window.__GAME_TEST__?.setRemainingTime(0)
  })
  await expect(
    page.getByRole('heading', { name: 'Time is up!' }),
  ).toBeVisible()
  await expect(page.getByText('Confirmed', { exact: true })).toBeVisible()

  await expect(page.locator('.arena-panel')).toHaveScreenshot(
    'match-result.png',
    { animations: 'disabled' },
  )
})
