import type { PlayerInput } from '../core/GameState'

const GAMEPLAY_KEYS = new Set([
  'KeyW',
  'KeyA',
  'KeyD',
  'ArrowUp',
  'ArrowLeft',
  'ArrowRight',
  'Space',
])

export class KeyboardInput {
  private readonly pressedKeys = new Set<string>()
  private readonly target: Window
  private fireFrontQueued = false

  constructor(target: Window) {
    this.target = target
    target.addEventListener('keydown', this.handleKeyDown)
    target.addEventListener('keyup', this.handleKeyUp)
    target.addEventListener('blur', this.clear)
  }

  read(): PlayerInput {
    const fireFront = this.fireFrontQueued
    this.fireFrontQueued = false

    return {
      forward:
        this.pressedKeys.has('KeyW') || this.pressedKeys.has('ArrowUp'),
      turnLeft:
        this.pressedKeys.has('KeyA') || this.pressedKeys.has('ArrowLeft'),
      turnRight:
        this.pressedKeys.has('KeyD') || this.pressedKeys.has('ArrowRight'),
      fireFront,
    }
  }

  destroy() {
    this.target.removeEventListener('keydown', this.handleKeyDown)
    this.target.removeEventListener('keyup', this.handleKeyUp)
    this.target.removeEventListener('blur', this.clear)
    this.clear()
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (GAMEPLAY_KEYS.has(event.code)) {
      event.preventDefault()

      if (event.code === 'Space' && !this.pressedKeys.has(event.code)) {
        this.fireFrontQueued = true
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

  private readonly clear = () => {
    this.pressedKeys.clear()
    this.fireFrontQueued = false
  }
}
