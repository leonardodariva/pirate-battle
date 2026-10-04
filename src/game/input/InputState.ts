import type { PlayerInput } from '../core/GameState'

export type InputAction = keyof PlayerInput

const FIRE_ACTIONS = new Set<InputAction>([
  'fireFront',
  'fireLeftBroadside',
  'fireRightBroadside',
])

export class InputState {
  private readonly activeSources = new Map<InputAction, Set<string>>()
  private readonly queuedActions = new Set<InputAction>()

  press(action: InputAction, source: string) {
    const sources = this.activeSources.get(action) ?? new Set<string>()
    const isNewPress = !sources.has(source)

    sources.add(source)
    this.activeSources.set(action, sources)

    if (isNewPress && FIRE_ACTIONS.has(action)) {
      this.queuedActions.add(action)
    }
  }

  release(action: InputAction, source: string) {
    const sources = this.activeSources.get(action)
    sources?.delete(source)

    if (sources?.size === 0) {
      this.activeSources.delete(action)
    }
  }

  read(): PlayerInput {
    const input = {
      forward: this.isActive('forward'),
      turnLeft: this.isActive('turnLeft'),
      turnRight: this.isActive('turnRight'),
      fireFront: this.queuedActions.has('fireFront'),
      fireLeftBroadside: this.queuedActions.has('fireLeftBroadside'),
      fireRightBroadside: this.queuedActions.has('fireRightBroadside'),
    }

    this.queuedActions.clear()
    return input
  }

  clear() {
    this.activeSources.clear()
    this.queuedActions.clear()
  }

  private isActive(action: InputAction) {
    return (this.activeSources.get(action)?.size ?? 0) > 0
  }
}
