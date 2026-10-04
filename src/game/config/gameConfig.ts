export interface GameConfig {
  arena: {
    width: number
    height: number
  }
  loop: {
    fixedStepSeconds: number
    maxFrameDeltaSeconds: number
  }
  match: {
    sessionDurationSeconds: number
  }
  player: {
    maxHealth: number
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
  chaser: {
    maxHealth: number
    collisionDamage: number
    movementSpeed: number
    rotationSpeed: number
    collisionRadius: number
  }
  shooter: {
    maxHealth: number
    movementSpeed: number
    rotationSpeed: number
    collisionRadius: number
    attackRange: number
    fireCooldownSeconds: number
    aimToleranceRadians: number
    projectileSpeed: number
    projectileDamage: number
    projectileLifetimeSeconds: number
    projectileSpawnOffset: number
  }
  spawn: {
    intervalSeconds: number
    minimumDistanceFromPlayer: number
    minimumDistanceFromEnemies: number
    positions: ReadonlyArray<{
      x: number
      y: number
    }>
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
  match: {
    sessionDurationSeconds: 120,
  },
  player: {
    maxHealth: 100,
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
  chaser: {
    maxHealth: 3,
    collisionDamage: 25,
    movementSpeed: 90,
    rotationSpeed: 2.2,
    collisionRadius: 25,
  },
  shooter: {
    maxHealth: 3,
    movementSpeed: 70,
    rotationSpeed: 1.8,
    collisionRadius: 25,
    attackRange: 360,
    fireCooldownSeconds: 1.5,
    aimToleranceRadians: 0.12,
    projectileSpeed: 360,
    projectileDamage: 10,
    projectileLifetimeSeconds: 2.5,
    projectileSpawnOffset: 52,
  },
  spawn: {
    intervalSeconds: 5,
    minimumDistanceFromPlayer: 240,
    minimumDistanceFromEnemies: 100,
    positions: [
      { x: 120, y: 120 },
      { x: 1_160, y: 120 },
      { x: 1_160, y: 600 },
      { x: 120, y: 600 },
      { x: 640, y: 90 },
      { x: 640, y: 630 },
    ],
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
    {
      id: 'southwest-island',
      x: 190,
      y: 500,
      width: 192,
      height: 192,
      collisionInset: 12,
    },
  ],
}
