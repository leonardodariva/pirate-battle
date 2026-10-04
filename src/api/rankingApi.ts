import { httpClient } from './httpClient'
import type { PaginatedResponse, RankingEntry } from './types'

interface GetRankingParameters {
  configKey: string
  page: number
  pageSize: number
  signal?: AbortSignal
}

export async function getRanking({
  configKey,
  page,
  pageSize,
  signal,
}: GetRankingParameters) {
  const response = await httpClient.get<PaginatedResponse<RankingEntry>>(
    '/ranking',
    {
      params: { configKey, page, pageSize },
      signal,
    },
  )

  return response.data
}
