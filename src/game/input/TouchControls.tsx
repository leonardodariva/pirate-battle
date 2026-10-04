import {
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import buttonNormalUrl from '../../../assets/png/default/ui/controls/button_round_normal.png'
import buttonPressedUrl from '../../../assets/png/default/ui/controls/button_round_pressed.png'
import fireFrontIconUrl from '../../../assets/png/default/ui/controls/icon_fire_front.png'
import fireLeftIconUrl from '../../../assets/png/default/ui/controls/icon_fire_left.png'
import fireRightIconUrl from '../../../assets/png/default/ui/controls/icon_fire_right.png'
import type { InputAction } from './InputState'
import { getJoystickMovement } from './joystick'

interface TouchControlsProps {
  onPress: (action: InputAction, source: string) => void
  onRelease: (action: InputAction, source: string) => void
  onAnalogMovement: (
    source: string,
    forwardAmount: number,
    desiredRotation: number | undefined,
  ) => void
  onAnalogMovementEnd: (source: string) => void
}

interface StickPosition {
  x: number
  y: number
}

const CENTERED_STICK: StickPosition = { x: 0, y: 0 }

export function TouchControls({
  onPress,
  onRelease,
  onAnalogMovement,
  onAnalogMovementEnd,
}: TouchControlsProps) {
  const joystickRef = useRef<HTMLDivElement>(null)
  const activePointerIdRef = useRef<number | null>(null)
  const [stickPosition, setStickPosition] =
    useState<StickPosition>(CENTERED_STICK)

  const sourceFor = (pointerId: number) => `pointer:${pointerId}`

  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const joystick = joystickRef.current

    if (!joystick || activePointerIdRef.current !== event.pointerId) {
      return
    }

    const bounds = joystick.getBoundingClientRect()
    const centerX = bounds.left + bounds.width / 2
    const centerY = bounds.top + bounds.height / 2
    const maximumDistance = Math.min(bounds.width, bounds.height) * 0.32
    const rawX = event.clientX - centerX
    const rawY = event.clientY - centerY
    const distance = Math.hypot(rawX, rawY)
    const scale = distance > maximumDistance ? maximumDistance / distance : 1
    const x = rawX * scale
    const y = rawY * scale

    setStickPosition({ x, y })
    const movement = getJoystickMovement(
      x / maximumDistance,
      y / maximumDistance,
    )
    onAnalogMovement(
      sourceFor(event.pointerId),
      movement.forwardAmount,
      movement.desiredRotation,
    )
  }

  const startJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault()

    if (activePointerIdRef.current !== null) {
      return
    }

    activePointerIdRef.current = event.pointerId
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Browser tests dispatch synthetic pointers without a native capture.
    }
    updateJoystick(event)
  }

  const stopJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return
    }

    event.preventDefault()
    onAnalogMovementEnd(sourceFor(event.pointerId))
    activePointerIdRef.current = null
    setStickPosition(CENTERED_STICK)
  }

  const pressWeapon = (
    action: InputAction,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Browser tests dispatch synthetic pointers without a native capture.
    }
    onPress(action, sourceFor(event.pointerId))
  }

  const releaseWeapon = (
    action: InputAction,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    onRelease(action, sourceFor(event.pointerId))
  }

  const weaponButton = (
    action: InputAction,
    label: string,
    iconUrl: string,
  ) => (
    <button
      type="button"
      className="touch-weapon-button"
      aria-label={label}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => pressWeapon(action, event)}
      onPointerUp={(event) => releaseWeapon(action, event)}
      onPointerCancel={(event) => releaseWeapon(action, event)}
      onLostPointerCapture={(event) => releaseWeapon(action, event)}
    >
      <img
        className="touch-button-face touch-button-normal"
        src={buttonNormalUrl}
        alt=""
        draggable={false}
      />
      <img
        className="touch-button-face touch-button-pressed"
        src={buttonPressedUrl}
        alt=""
        draggable={false}
      />
      <img className="touch-weapon-icon" src={iconUrl} alt="" draggable={false} />
    </button>
  )

  const thumbStyle = {
    '--stick-x': `${stickPosition.x}px`,
    '--stick-y': `${stickPosition.y}px`,
  } as CSSProperties

  return (
    <div
      className="touch-controls"
      aria-label="Touch game controls"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        ref={joystickRef}
        className="touch-joystick"
        aria-label="Movement joystick"
        style={thumbStyle}
        onPointerDown={startJoystick}
        onPointerMove={updateJoystick}
        onPointerUp={stopJoystick}
        onPointerCancel={stopJoystick}
        onLostPointerCapture={stopJoystick}
      >
        <span className="touch-joystick-thumb" aria-hidden="true" />
      </div>

      <div className="touch-weapon-controls">
        {weaponButton(
          'fireLeftBroadside',
          'Fire left broadside',
          fireLeftIconUrl,
        )}
        {weaponButton('fireFront', 'Fire front cannon', fireFrontIconUrl)}
        {weaponButton(
          'fireRightBroadside',
          'Fire right broadside',
          fireRightIconUrl,
        )}
      </div>
    </div>
  )
}
