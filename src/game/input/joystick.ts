const JOYSTICK_DEAD_ZONE = 0.18

export interface JoystickMovement {
  forwardAmount: number
  desiredRotation: number | undefined
}

export function getJoystickMovement(
  normalizedX: number,
  normalizedY: number,
): JoystickMovement {
  const magnitude = Math.min(1, Math.hypot(normalizedX, normalizedY))
  const forwardAmount = applyDeadZone(magnitude)

  return {
    forwardAmount,
    desiredRotation:
      forwardAmount === 0
        ? undefined
        : Math.atan2(normalizedX, -normalizedY),
  }
}

function applyDeadZone(value: number) {
  const clampedValue = Math.min(1, Math.max(0, value))

  if (clampedValue <= JOYSTICK_DEAD_ZONE) {
    return 0
  }

  return (clampedValue - JOYSTICK_DEAD_ZONE) / (1 - JOYSTICK_DEAD_ZONE)
}
