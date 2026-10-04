import type { InputAction } from './InputState'

const JOYSTICK_DEAD_ZONE = 0.25

export function getJoystickActions(
  normalizedX: number,
  normalizedY: number,
): InputAction[] {
  const actions: InputAction[] = []

  if (normalizedY < -JOYSTICK_DEAD_ZONE) {
    actions.push('forward')
  }

  if (normalizedX < -JOYSTICK_DEAD_ZONE) {
    actions.push('turnLeft')
  } else if (normalizedX > JOYSTICK_DEAD_ZONE) {
    actions.push('turnRight')
  }

  return actions
}
