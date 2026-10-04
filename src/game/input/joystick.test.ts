import { describe, expect, it } from 'vitest'
import { getJoystickMovement } from './joystick'

describe('getJoystickMovement', () => {
  it('does nothing inside the central dead zone', () => {
    expect(getJoystickMovement(0.1, -0.1)).toEqual({
      forwardAmount: 0,
      turnAmount: 0,
    })
  })

  it('reaches full speed when pushed to the edge', () => {
    expect(getJoystickMovement(0, -1)).toEqual({
      forwardAmount: 1,
      turnAmount: 0,
    })
  })

  it('combines proportional movement and rotation on a diagonal', () => {
    const movement = getJoystickMovement(0.7, -0.7)

    expect(movement.forwardAmount).toBeGreaterThan(0.6)
    expect(movement.forwardAmount).toBeLessThan(0.7)
    expect(movement.turnAmount).toBeCloseTo(movement.forwardAmount)
  })

  it('preserves the direction of left and right rotation', () => {
    expect(getJoystickMovement(-1, 0).turnAmount).toBe(-1)
    expect(getJoystickMovement(1, 0).turnAmount).toBe(1)
  })
})
