import type { GameOptions } from './gameOptions'

export function createConfigKey(options: GameOptions) {
  return [
    'v1',
    `duration=${options.sessionDurationSeconds}`,
    `spawn=${options.enemySpawnIntervalSeconds}`,
  ].join(':')
}
