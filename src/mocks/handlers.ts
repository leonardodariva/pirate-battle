import { delay, http, HttpResponse } from 'msw'
import type { RankingEntry } from '../api/types'
import { createHistoryFixtures, getHistoryPage } from './historyData'
import {
  isMatchRecord,
  readConfirmedMatches,
  registerMatch,
} from './mockMatchStore'
import { readNetworkScenario } from './networkScenario'
import { getRankingPage, rankingFixtures } from './rankingData'

const PAGE_SIZE_LIMIT = 20

export const handlers = [
  http.get('/api/ranking', async ({ request }) => {
    const url = new URL(request.url)
    const configKey = url.searchParams.get('configKey')
    const page = readPositiveInteger(url.searchParams.get('page'), 1)
    const pageSize = Math.min(
      readPositiveInteger(url.searchParams.get('pageSize'), 5),
      PAGE_SIZE_LIMIT,
    )

    if (!configKey) {
      return HttpResponse.json(
        { message: 'configKey is required.' },
        { status: 400 },
      )
    }

    await delay(180)
    const confirmedRankingEntries: RankingEntry[] = readConfirmedMatches().map(
      (match) => ({
        matchId: match.matchId,
        playerId: match.playerId,
        playerName: match.playerName,
        score: match.score,
        durationSeconds: match.durationSeconds,
        completedAt: match.completedAt,
        configKey: match.configKey,
      }),
    )
    return HttpResponse.json(
      getRankingPage(
        [...rankingFixtures, ...confirmedRankingEntries],
        configKey,
        page,
        pageSize,
      ),
    )
  }),
  http.get('/api/history', async ({ request }) => {
    const url = new URL(request.url)
    const playerId = url.searchParams.get('playerId')
    const page = readPositiveInteger(url.searchParams.get('page'), 1)
    const pageSize = Math.min(
      readPositiveInteger(url.searchParams.get('pageSize'), 5),
      PAGE_SIZE_LIMIT,
    )

    if (!playerId) {
      return HttpResponse.json(
        { message: 'playerId is required.' },
        { status: 400 },
      )
    }

    await delay(180)
    const records = [
      ...createHistoryFixtures(playerId),
      ...readConfirmedMatches(),
    ]
    return HttpResponse.json(
      getHistoryPage(records, playerId, page, pageSize),
    )
  }),
  http.post('/api/matches', async ({ request }) => {
    const body: unknown = await request.json()

    if (!isMatchRecord(body)) {
      return HttpResponse.json(
        { message: 'A valid match record is required.' },
        { status: 400 },
      )
    }

    if (readNetworkScenario() === 'post-network-error') {
      return HttpResponse.error()
    }

    await delay(180)
    const result = registerMatch(body)
    return HttpResponse.json(result, { status: result.created ? 201 : 200 })
  }),
]

function readPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}
