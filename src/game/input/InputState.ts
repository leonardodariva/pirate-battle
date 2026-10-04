import type { PlayerInput } from '../core/GameState'

export type InputAction =
  | 'forward'
  | 'turnLeft'
  | 'turnRight'
  | 'fireFront'
  | 'fireLeftBroadside'
  | 'fireRightBroadside'

interface AnalogMovement {
  forwardAmount: number
  desiredRotation: number
}

const FIRE_ACTIONS = new Set<InputAction>([
  'fireFront',
  'fireLeftBroadside',
  'fireRightBroadside',
])

export class InputState {
  private readonly activeSources = new Map<InputAction, Set<string>>()
  private readonly queuedActions = new Set<InputAction>()
  private readonly analogMovementBySource = new Map<string, AnalogMovement>()

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

  setAnalogMovement(
    source: string,
    forwardAmount: number,
    desiredRotation: number | undefined,
  ) {
    if (forwardAmount <= 0 || desiredRotation === undefined) {
      this.analogMovementBySource.delete(source)
      return
    }

    this.analogMovementBySource.set(source, {
      forwardAmount: clamp(forwardAmount, 0, 1),
      desiredRotation,
    })
  }

  clearAnalogMovement(source: string) {
    this.analogMovementBySource.delete(source)
  }

  read(): PlayerInput {
    const digitalForward = this.isActive('forward')
    const digitalTurn =
      Number(this.isActive('turnRight')) - Number(this.isActive('turnLeft'))
    let analogMovement: AnalogMovement | undefined

    for (const movement of this.analogMovementBySource.values()) {
      if (
        !analogMovement ||
        movement.forwardAmount > analogMovement.forwardAmount
      ) {
        analogMovement = movement
      }
    }

    const forwardAmount = Math.max(
      Number(digitalForward),
      analogMovement?.forwardAmount ?? 0,
    )
    const turnAmount = digitalTurn
    const input: PlayerInput = {
      forward: forwardAmount > 0,
      turnLeft: turnAmount < 0,
      turnRight: turnAmount > 0,
      forwardAmount,
      turnAmount,
      desiredRotation:
        digitalTurn === 0 ? analogMovement?.desiredRotation : undefined,
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
    this.analogMovementBySource.clear()
  }

  private isActive(action: InputAction) {
    return (this.activeSources.get(action)?.size ?? 0) > 0
  }
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}
