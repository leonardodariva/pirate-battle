import type { MatchRecord } from './types'

export function isMatchRecord(value: unknown): value is MatchRecord {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>
  const configuration = candidate.configuration

  return (
    typeof candidate.matchId === 'string' &&
    candidate.matchId.length > 0 &&
    typeof candidate.playerId === 'string' &&
    candidate.playerId.length > 0 &&
    typeof candidate.playerName === 'string' &&
    candidate.playerName.length > 0 &&
    typeof candidate.score === 'number' &&
    typeof candidate.durationSeconds === 'number' &&
    (candidate.endReason === 'timeout' ||
      candidate.endReason === 'player_destroyed') &&
    typeof candidate.completedAt === 'string' &&
    typeof candidate.configKey === 'string' &&
    typeof configuration === 'object' &&
    configuration !== null &&
    typeof (configuration as Record<string, unknown>)
      .sessionDurationSeconds === 'number' &&
    typeof (configuration as Record<string, unknown>)
      .enemySpawnIntervalSeconds === 'number'
  )
}
