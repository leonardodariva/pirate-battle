export interface RankingEntry {
  matchId: string
  playerId: string
  playerName: string
  score: number
  durationSeconds: number
  completedAt: string
  configKey: string
}

export type MatchEndReason = 'timeout' | 'player_destroyed'

export interface MatchConfigurationSnapshot {
  sessionDurationSeconds: number
  enemySpawnIntervalSeconds: number
}

export interface MatchHistoryEntry {
  matchId: string
  playerId: string
  score: number
  durationSeconds: number
  endReason: MatchEndReason
  completedAt: string
  configuration: MatchConfigurationSnapshot
}

export interface MatchRecord extends MatchHistoryEntry {
  playerName: string
  configKey: string
}

export interface SubmitMatchResponse {
  match: MatchRecord
  created: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
