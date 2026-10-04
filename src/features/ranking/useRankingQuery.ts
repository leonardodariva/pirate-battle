import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { getRanking } from '../../api/rankingApi'

const RANKING_PAGE_SIZE = 5

export function useRankingQuery(configKey: string, page: number) {
  return useQuery({
    queryKey: queryKeys.ranking(configKey, page),
    queryFn: ({ signal }) =>
      getRanking({
        configKey,
        page,
        pageSize: RANKING_PAGE_SIZE,
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}
