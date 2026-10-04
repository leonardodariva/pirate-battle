import { httpClient } from './httpClient'
import type { MatchHistoryEntry, PaginatedResponse } from './types'

interface GetMatchHistoryParameters {
  playerId: string
  page: number
  pageSize: number
  signal?: AbortSignal
}

export async function getMatchHistory({
  playerId,
  page,
  pageSize,
  signal,
}: GetMatchHistoryParameters) {
  const response = await httpClient.get<PaginatedResponse<MatchHistoryEntry>>(
    '/history',
    {
      params: { playerId, page, pageSize },
      signal,
    },
  )

  return response.data
}
