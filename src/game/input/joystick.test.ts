import { describe, expect, it } from 'vitest'
import { getJoystickMovement } from './joystick'

describe('getJoystickMovement', () => {
  it('does nothing inside the central dead zone', () => {
    expect(getJoystickMovement(0.1, -0.1)).toEqual({
      forwardAmount: 0,
      desiredRotation: undefined,
    })
  })

  it('reaches full speed when pushed to the edge', () => {
    expect(getJoystickMovement(0, -1)).toEqual({
      forwardAmount: 1,
      desiredRotation: 0,
    })
  })

  it('uses the stick angle as the desired ship direction', () => {
    const movement = getJoystickMovement(0.7, -0.7)

    expect(movement.forwardAmount).toBeGreaterThan(0.98)
    expect(movement.desiredRotation).toBeCloseTo(Math.PI / 4)
  })

  it('supports every direction, including downward movement', () => {
    expect(getJoystickMovement(-1, 0).desiredRotation).toBeCloseTo(
      -Math.PI / 2,
    )
    expect(getJoystickMovement(1, 0).desiredRotation).toBeCloseTo(
      Math.PI / 2,
    )
    expect(Math.abs(getJoystickMovement(0, 1).desiredRotation ?? 0)).toBeCloseTo(
      Math.PI,
    )
  })
})
