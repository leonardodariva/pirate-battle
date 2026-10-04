import type { GameConfig } from './gameConfig'

export interface GameOptions {
  sessionDurationSeconds: number
  enemySpawnIntervalSeconds: number
}

export type GameOptionsErrors = Partial<Record<keyof GameOptions, string>>

export const GAME_OPTION_LIMITS = {
  sessionDurationSeconds: { minimum: 60, maximum: 180 },
  enemySpawnIntervalSeconds: { minimum: 1, maximum: 20 },
} as const

export const DEFAULT_GAME_OPTIONS: GameOptions = {
  sessionDurationSeconds: 120,
  enemySpawnIntervalSeconds: 5,
}

export function validateGameOptions(options: GameOptions): GameOptionsErrors {
  const errors: GameOptionsErrors = {}
  const durationLimits = GAME_OPTION_LIMITS.sessionDurationSeconds
  const spawnLimits = GAME_OPTION_LIMITS.enemySpawnIntervalSeconds

  if (
    !Number.isInteger(options.sessionDurationSeconds) ||
    options.sessionDurationSeconds < durationLimits.minimum ||
    options.sessionDurationSeconds > durationLimits.maximum
  ) {
    errors.sessionDurationSeconds = `Enter a whole number from ${durationLimits.minimum} to ${durationLimits.maximum} seconds.`
  }

  if (
    !Number.isInteger(options.enemySpawnIntervalSeconds) ||
    options.enemySpawnIntervalSeconds < spawnLimits.minimum ||
    options.enemySpawnIntervalSeconds > spawnLimits.maximum
  ) {
    errors.enemySpawnIntervalSeconds = `Enter a whole number from ${spawnLimits.minimum} to ${spawnLimits.maximum} seconds.`
  }

  return errors
}

export function areGameOptionsValid(options: GameOptions) {
  return Object.keys(validateGameOptions(options)).length === 0
}

export function createMatchConfig(
  baseConfig: GameConfig,
  options: GameOptions,
): GameConfig {
  return {
    ...baseConfig,
    match: {
      ...baseConfig.match,
      sessionDurationSeconds: options.sessionDurationSeconds,
    },
    spawn: {
      ...baseConfig.spawn,
      intervalSeconds: options.enemySpawnIntervalSeconds,
    },
  }
}
