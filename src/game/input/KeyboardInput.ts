import { type InputAction, InputState } from './InputState'

const KEY_ACTIONS: Readonly<Record<string, InputAction>> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyA: 'turnLeft',
  ArrowLeft: 'turnLeft',
  KeyD: 'turnRight',
  ArrowRight: 'turnRight',
  Space: 'fireFront',
  KeyQ: 'fireLeftBroadside',
  KeyE: 'fireRightBroadside',
}

export class KeyboardInput {
  private readonly target: Window
  private readonly inputState: InputState
  private readonly onPauseRequested: () => void

  constructor(
    target: Window,
    inputState: InputState,
    onPauseRequested: () => void = () => {},
  ) {
    this.target = target
    this.inputState = inputState
    this.onPauseRequested = onPauseRequested
    target.addEventListener('keydown', this.handleKeyDown)
    target.addEventListener('keyup', this.handleKeyUp)
    target.addEventListener('blur', this.handleBlur)
  }

  destroy() {
    this.target.removeEventListener('keydown', this.handleKeyDown)
    this.target.removeEventListener('keyup', this.handleKeyUp)
    this.target.removeEventListener('blur', this.handleBlur)
    this.inputState.clear()
  }

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      event.preventDefault()

      if (!event.repeat) {
        this.onPauseRequested()
      }
      return
    }

    const action = KEY_ACTIONS[event.code]

    if (action) {
      event.preventDefault()
      this.inputState.press(action, `keyboard:${event.code}`)
    }
  }

  private readonly handleKeyUp = (event: KeyboardEvent) => {
    const action = KEY_ACTIONS[event.code]

    if (action) {
      event.preventDefault()
      this.inputState.release(action, `keyboard:${event.code}`)
    }
  }

  private readonly handleBlur = () => {
    this.inputState.clear()
  }
}
