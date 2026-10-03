export type FixedUpdate = (fixedStepSeconds: number) => void

export class GameLoop {
  private accumulatorSeconds = 0
  private readonly fixedStepSeconds: number
  private readonly maxFrameDeltaSeconds: number
  private readonly update: FixedUpdate

  constructor(
    fixedStepSeconds: number,
    maxFrameDeltaSeconds: number,
    update: FixedUpdate,
  ) {
    this.fixedStepSeconds = fixedStepSeconds
    this.maxFrameDeltaSeconds = maxFrameDeltaSeconds
    this.update = update
  }

  advance(frameDeltaSeconds: number) {
    const safeFrameDelta = Math.max(
      0,
      Math.min(frameDeltaSeconds, this.maxFrameDeltaSeconds),
    )

    this.accumulatorSeconds += safeFrameDelta

    while (this.accumulatorSeconds + 1e-9 >= this.fixedStepSeconds) {
      this.update(this.fixedStepSeconds)
      this.accumulatorSeconds -= this.fixedStepSeconds
    }
  }

  reset() {
    this.accumulatorSeconds = 0
  }
}
