const JOYSTICK_DEAD_ZONE = 0.18

export interface JoystickMovement {
  forwardAmount: number
  turnAmount: number
}

export function getJoystickMovement(
  normalizedX: number,
  normalizedY: number,
): JoystickMovement {
  return {
    forwardAmount: applyDeadZone(-normalizedY),
    turnAmount:
      Math.sign(normalizedX) * applyDeadZone(Math.abs(normalizedX)),
  }
}

function applyDeadZone(value: number) {
  const clampedValue = Math.min(1, Math.max(0, value))

  if (clampedValue <= JOYSTICK_DEAD_ZONE) {
    return 0
  }

  return (clampedValue - JOYSTICK_DEAD_ZONE) / (1 - JOYSTICK_DEAD_ZONE)
}
