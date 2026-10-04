import { describe, expect, it } from 'vitest'
import { createHistoryFixtures, getHistoryPage } from './historyData'

describe('getHistoryPage', () => {
  it('filters by player, orders newest first, and paginates', () => {
    const playerRecords = createHistoryFixtures('current-player')
    const records = [
      ...playerRecords,
      ...createHistoryFixtures('another-player'),
    ]
    const result = getHistoryPage(records, 'current-player', 1, 5)

    expect(result.items.map((entry) => entry.matchId)).toEqual([
      'history-01',
      'history-02',
      'history-03',
      'history-04',
      'history-05',
    ])
    expect(result.items.every((entry) => entry.playerId === 'current-player')).toBe(
      true,
    )
    expect(result).toMatchObject({
      page: 1,
      pageSize: 5,
      totalItems: 7,
      totalPages: 2,
    })
  })

  it('returns the second page without mutating its input', () => {
    const records = createHistoryFixtures('current-player')
    const firstMatchId = records[0]?.matchId
    const result = getHistoryPage(records, 'current-player', 2, 5)

    expect(result.items).toHaveLength(2)
    expect(records[0]?.matchId).toBe(firstMatchId)
  })
})
