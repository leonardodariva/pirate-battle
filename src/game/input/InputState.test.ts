import { describe, expect, it } from 'vitest'
import { InputState } from './InputState'

describe('InputState', () => {
  it('supports simultaneous movement and fire actions', () => {
    const input = new InputState()
    input.press('forward', 'touch:1')
    input.press('fireFront', 'touch:2')

    expect(input.read()).toMatchObject({
      forward: true,
      fireFront: true,
    })
  })

  it('keeps continuous actions active and consumes fire actions once', () => {
    const input = new InputState()
    input.press('forward', 'keyboard:KeyW')
    input.press('fireFront', 'keyboard:Space')

    expect(input.read()).toMatchObject({ forward: true, fireFront: true })
    expect(input.read()).toMatchObject({ forward: true, fireFront: false })
  })

  it('keeps an action active while another input source still holds it', () => {
    const input = new InputState()
    input.press('forward', 'keyboard:KeyW')
    input.press('forward', 'touch:1')
    input.release('forward', 'touch:1')

    expect(input.read().forward).toBe(true)
  })

  it('clears held and queued actions together', () => {
    const input = new InputState()
    input.press('forward', 'touch:1')
    input.press('fireFront', 'touch:2')
    input.clear()

    expect(input.read()).toEqual({
      forward: false,
      turnLeft: false,
      turnRight: false,
      forwardAmount: 0,
      turnAmount: 0,
      desiredRotation: undefined,
      fireFront: false,
      fireLeftBroadside: false,
      fireRightBroadside: false,
    })
  })

  it('preserves proportional movement from an analog source', () => {
    const input = new InputState()
    input.setAnalogMovement('pointer:1', 0.45, Math.PI)

    expect(input.read()).toMatchObject({
      forward: true,
      turnLeft: false,
      turnRight: false,
      forwardAmount: 0.45,
      turnAmount: 0,
      desiredRotation: Math.PI,
    })

    input.clearAnalogMovement('pointer:1')
    expect(input.read()).toMatchObject({
      forwardAmount: 0,
      turnAmount: 0,
      desiredRotation: undefined,
    })
  })
})
