export interface GameConfig {
  arena: {
    width: number
    height: number
  }
  loop: {
    fixedStepSeconds: number
    maxFrameDeltaSeconds: number
  }
  player: {
    movementSpeed: number
    rotationSpeed: number
    boundaryRadius: number
  }
}

export const GAME_CONFIG: GameConfig = {
  arena: {
    width: 1280,
    height: 720,
  },
  loop: {
    fixedStepSeconds: 1 / 60,
    maxFrameDeltaSeconds: 0.1,
  },
  player: {
    movementSpeed: 220,
    rotationSpeed: Math.PI,
    boundaryRadius: 52,
  },
}
