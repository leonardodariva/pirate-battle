import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getMatchHistory } from '../../api/historyApi'
import { queryKeys } from '../../api/queryKeys'

const HISTORY_PAGE_SIZE = 5

export function useMatchHistoryQuery(playerId: string, page: number) {
  return useQuery({
    queryKey: queryKeys.history(playerId, page),
    queryFn: ({ signal }) =>
      getMatchHistory({
        playerId,
        page,
        pageSize: HISTORY_PAGE_SIZE,
        signal,
      }),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}
