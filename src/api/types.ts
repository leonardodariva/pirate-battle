export interface RankingEntry {
  matchId: string
  playerId: string
  playerName: string
  score: number
  durationSeconds: number
  completedAt: string
  configKey: string
}

export interface PaginatedResponse<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
