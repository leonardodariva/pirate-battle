import type { MatchHistoryEntry, PaginatedResponse } from '../api/types'

const historyTemplates = [
  ['history-01', 14, 120, 'timeout', '2026-10-03T18:30:00Z', 120, 5],
  ['history-02', 8, 76, 'player_destroyed', '2026-10-02T21:15:00Z', 120, 5],
  ['history-03', 22, 120, 'timeout', '2026-10-01T19:45:00Z', 120, 5],
  ['history-04', 5, 43, 'player_destroyed', '2026-09-30T16:20:00Z', 120, 5],
  ['history-05', 17, 90, 'timeout', '2026-09-29T20:10:00Z', 90, 3],
  ['history-06', 11, 68, 'player_destroyed', '2026-09-28T17:00:00Z', 90, 3],
  ['history-07', 29, 180, 'timeout', '2026-09-27T14:35:00Z', 180, 8],
] as const

export function createHistoryFixtures(playerId: string): MatchHistoryEntry[] {
  return historyTemplates.map(
    ([
      matchId,
      score,
      durationSeconds,
      endReason,
      completedAt,
      sessionDurationSeconds,
      enemySpawnIntervalSeconds,
    ]) => ({
      matchId,
      playerId,
      score,
      durationSeconds,
      endReason,
      completedAt,
      configuration: {
        sessionDurationSeconds,
        enemySpawnIntervalSeconds,
      },
    }),
  )
}

export function getHistoryPage(
  records: MatchHistoryEntry[],
  playerId: string,
  page: number,
  pageSize: number,
): PaginatedResponse<MatchHistoryEntry> {
  const matchingRecords = records
    .filter((record) => record.playerId === playerId)
    .toSorted(
      (left, right) =>
        right.completedAt.localeCompare(left.completedAt) ||
        left.matchId.localeCompare(right.matchId),
    )
  const totalItems = matchingRecords.length
  const totalPages = Math.ceil(totalItems / pageSize)
  const startIndex = (page - 1) * pageSize

  return {
    items: matchingRecords.slice(startIndex, startIndex + pageSize),
    page,
    pageSize,
    totalItems,
    totalPages,
  }
}
