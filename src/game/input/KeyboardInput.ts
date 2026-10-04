import type { PlayerInput } from '../core/GameState'

const GAMEPLAY_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'KeyQ',
  'KeyE',
])

export class KeyboardInput {
  private readonly pressedKeys = new Set<string>()
  private readonly target: Window
  private readonly onPauseRequested: () => void
  private fireFrontQueued = false
  private fireLeftBroadsideQueued = false
  private fireRightBroadsideQueued = false

  constructor(target: Window, onPauseRequested: () => void = () => {}) {
    this.target = target
    this.onPauseRequested = onPauseRequested
    target.addEventListener('keydown', this.handleKeyDown)
    target.addEventListener('keyup', this.handleKeyUp)
    target.addEventListener('blur', this.clear)
  }

  read(): PlayerInput {
    const fireFront = this.fireFrontQueued
    const fireLeftBroadside = this.fireLeftBroadsideQueued
    const fireRightBroadside = this.fireRightBroadsideQueued
    this.fireFrontQueued = false
    this.fireLeftBroadsideQueued = false
    this.fireRightBroadsideQueued = false

    return {
      forward:
        this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp'),
      turnLeft:
        this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft'),
      turnRight:
        this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight'),
      fireFront,
      fireLeftBroadside,
      fireRightBroadside,
    }
  }

  destroy() {
    this.target.removeEventListener('keydown', this.handleKeyDown)
    this.target.removeEventListener('keyup', this.handleKeyUp)
    this.target.removeEventListener('blur', this.clear)
    this.clear()
  }

  readonly clear = () => {
    this.pressedKeys.clear()
    this.fireFrontQueued = false
    this.fireLeftBroadsideQueued = false
    this.fireRightBroadsideQueued = false
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault()

      if (!event.repeat) {
        this.onPauseRequested()
      }
      return
    }

    if (GAMEPLAY_KEYS.has(event.code)) {
      event.preventDefault()

      if (event.code === 'Space' && !this.pressedKeys.has(event.code)) {
        this.fireFrontQueued = true
      }

      if (event.code === 'KeyQ' && !this.pressedKeys.has(event.code)) {
        this.fireLeftBroadsideQueued = true
      }

      if (event.code === 'KeyE' && !this.pressedKeys.has(event.code)) {
        this.fireRightBroadsideQueued = true
      }

      this.pressedKeys.add(event.code)
    }
  }

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    if (GAMEPLAY_KEYS.has(event.code)) {
      event.preventDefault()
      this.pressedKeys.delete(event.code)
    }
  }

}
