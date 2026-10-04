import { describe, expect, it } from 'vitest'
import { getJoystickActions } from './joystick'

describe('getJoystickActions', () => {
  it('does nothing inside the central dead zone', () => {
    expect(getJoystickActions(0.1, -0.1)).toEqual([])
  })

  it('moves forward when the stick is pushed up', () => {
    expect(getJoystickActions(0, -0.8)).toEqual(['forward'])
  })

  it('combines forward movement and rotation on a diagonal', () => {
    expect(getJoystickActions(-0.7, -0.7)).toEqual([
      'forward',
      'turnLeft',
    ])
    expect(getJoystickActions(0.7, -0.7)).toEqual([
      'forward',
      'turnRight',
    ])
  })

  it('allows rotation without forward movement', () => {
    expect(getJoystickActions(-0.8, 0)).toEqual(['turnLeft'])
    expect(getJoystickActions(0.8, 0)).toEqual(['turnRight'])
  })
})
