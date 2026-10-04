import type { PaginatedResponse, RankingEntry } from '../api/types'
import { createConfigKey } from '../game/config/configKey'
import { DEFAULT_GAME_OPTIONS } from '../game/config/gameOptions'

const defaultConfigKey = createConfigKey(DEFAULT_GAME_OPTIONS)

export const rankingFixtures: RankingEntry[] = [
  ['match-01', 'player-01', 'Marina Tide', 18, 112, '2026-09-20T12:00:00Z'],
  ['match-02', 'player-02', 'Captain Coral', 31, 120, '2026-09-21T12:00:00Z'],
  ['match-03', 'player-03', 'Black Fin', 25, 120, '2026-09-22T12:00:00Z'],
  ['match-04', 'player-04', 'Storm Jane', 42, 118, '2026-09-23T12:00:00Z'],
  ['match-05', 'player-05', 'Blue Beard', 12, 84, '2026-09-24T12:00:00Z'],
  ['match-06', 'player-06', 'Reef Runner', 28, 120, '2026-09-25T12:00:00Z'],
  ['match-07', 'player-07', 'Moon Sailor', 36, 116, '2026-09-26T12:00:00Z'],
  ['match-08', 'player-08', 'Red Compass', 21, 120, '2026-09-27T12:00:00Z'],
  ['match-09', 'player-09', 'Wave Rider', 15, 95, '2026-09-28T12:00:00Z'],
  ['match-10', 'player-10', 'Iron Anchor', 33, 120, '2026-09-29T12:00:00Z'],
  ['match-11', 'player-11', 'Sea Fox', 27, 109, '2026-09-30T12:00:00Z'],
  ['match-12', 'player-12', 'Golden Wake', 39, 120, '2026-10-01T12:00:00Z'],
].map(
  ([matchId, playerId, playerName, score, durationSeconds, completedAt]) => ({
    matchId: String(matchId),
    playerId: String(playerId),
    playerName: String(playerName),
    score: Number(score),
    durationSeconds: Number(durationSeconds),
    completedAt: String(completedAt),
    configKey: defaultConfigKey,
  }),
)

rankingFixtures.push({
  matchId: 'different-config-match',
  playerId: 'different-config-player',
  playerName: 'Other Rules',
  score: 99,
  durationSeconds: 180,
  completedAt: '2026-10-02T12:00:00Z',
  configKey: createConfigKey({
    sessionDurationSeconds: 180,
    enemySpawnIntervalSeconds: 5,
  }),
})

export function getRankingPage(
  records: RankingEntry[],
  configKey: string,
  page: number,
  pageSize: number,
): PaginatedResponse<RankingEntry> {
  const matchingRecords = records
    .filter((record) => record.configKey === configKey)
    .toSorted(
      (left, right) =>
        right.score - left.score ||
        left.completedAt.localeCompare(right.completedAt) ||
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
