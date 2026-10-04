import { delay, http, HttpResponse } from 'msw'
import { createHistoryFixtures, getHistoryPage } from './historyData'
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
    return HttpResponse.json(
      getRankingPage(rankingFixtures, configKey, page, pageSize),
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
    const records = createHistoryFixtures(playerId)
    return HttpResponse.json(
      getHistoryPage(records, playerId, page, pageSize),
    )
  }),
]

function readPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value)
  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback
}
