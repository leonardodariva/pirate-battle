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
    collisionRadius: number
    collisionOffsets: readonly number[]
  }
  frontCannon: {
    cooldownSeconds: number
    projectileSpeed: number
    projectileDamage: number
    projectileLifetimeSeconds: number
    spawnOffset: number
  }
  broadside: {
    cooldownSeconds: number
    projectileSpeed: number
    projectileDamage: number
    projectileLifetimeSeconds: number
    spawnOffset: number
    cannonSpacing: number
  }
  projectiles: {
    collisionRadius: number
  }
  islands: ReadonlyArray<{
    id: string
    x: number
    y: number
    width: number
    height: number
    collisionInset: number
  }>
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
    collisionRadius: 25,
    collisionOffsets: [-27, 0, 27],
  },
  frontCannon: {
    cooldownSeconds: 0.6,
    projectileSpeed: 520,
    projectileDamage: 1,
    projectileLifetimeSeconds: 1.5,
    spawnOffset: 58,
  },
  broadside: {
    cooldownSeconds: 1.2,
    projectileSpeed: 460,
    projectileDamage: 1,
    projectileLifetimeSeconds: 1.5,
    spawnOffset: 38,
    cannonSpacing: 24,
  },
  projectiles: {
    collisionRadius: 5,
  },
  islands: [
    {
      id: 'north-island',
      x: 800,
      y: 180,
      width: 192,
      height: 192,
      collisionInset: 12,
    },
  ],
}
