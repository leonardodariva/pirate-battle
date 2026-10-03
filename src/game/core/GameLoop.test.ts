import { describe, expect, it, vi } from 'vitest'
import { GameLoop } from './GameLoop'

describe('GameLoop', () => {
  it('converts variable frame time into fixed updates', () => {
    const update = vi.fn()
    const loop = new GameLoop(0.01, 0.1, update)

    loop.advance(0.035)
    loop.advance(0.005)

    expect(update).toHaveBeenCalledTimes(4)
    expect(update).toHaveBeenCalledWith(0.01)
  })

  it('caps long frames to avoid an update spiral', () => {
    const update = vi.fn()
    const loop = new GameLoop(0.01, 0.05, update)

    loop.advance(1)

    expect(update).toHaveBeenCalledTimes(5)
  })

  it('clears accumulated time when reset', () => {
    const update = vi.fn()
    const loop = new GameLoop(0.01, 0.1, update)

    loop.advance(0.009)
    loop.reset()
    loop.advance(0.001)

    expect(update).not.toHaveBeenCalled()
  })
})
