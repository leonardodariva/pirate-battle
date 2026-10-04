import { describe, expect, it } from 'vitest'
import { createConfigKey } from '../game/config/configKey'
import { DEFAULT_GAME_OPTIONS } from '../game/config/gameOptions'
import { getRankingPage, rankingFixtures } from './rankingData'

describe('getRankingPage', () => {
  it('filters equivalent configurations, sorts scores, and paginates', () => {
    const result = getRankingPage(
      rankingFixtures,
      createConfigKey(DEFAULT_GAME_OPTIONS),
      1,
      5,
    )

    expect(result.items.map((entry) => entry.score)).toEqual([
      42, 39, 36, 33, 31,
    ])
    expect(result.items.map((entry) => entry.playerName)).not.toContain(
      'Other Rules',
    )
    expect(result).toMatchObject({
      page: 1,
      pageSize: 5,
      totalItems: 12,
      totalPages: 3,
    })
  })

  it('returns the requested page without mutating the fixtures', () => {
    const originalFirstMatch = rankingFixtures[0]?.matchId
    const result = getRankingPage(
      rankingFixtures,
      createConfigKey(DEFAULT_GAME_OPTIONS),
      3,
      5,
    )

    expect(result.items).toHaveLength(2)
    expect(rankingFixtures[0]?.matchId).toBe(originalFirstMatch)
  })
})
