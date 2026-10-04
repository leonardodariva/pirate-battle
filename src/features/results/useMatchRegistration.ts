import { useEffect, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { submitMatch } from '../../api/matchesApi'
import type { MatchRecord } from '../../api/types'

interface UseMatchRegistrationParameters {
  match: MatchRecord | null
}

export function useMatchRegistration({
  match,
}: UseMatchRegistrationParameters) {
  const queryClient = useQueryClient()
  const submittedMatchIdRef = useRef<string | null>(null)
  const mutation = useMutation({
    mutationFn: submitMatch,
    onSuccess: async (_response, submittedMatch) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ranking'] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.history(submittedMatch.playerId, 1).slice(0, 2),
        }),
      ])
    },
  })

  useEffect(() => {
    if (!match || submittedMatchIdRef.current === match.matchId) {
      return
    }

    submittedMatchIdRef.current = match.matchId
    mutation.mutate(match)
  }, [match, mutation])

  return mutation
}
