import { useEffect, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { submitMatch } from '../../api/matchesApi'
import type { MatchRecord } from '../../api/types'
import {
  loadPendingMatches,
  removePendingMatch,
  savePendingMatch,
} from '../../storage/pendingMatchStorage'

interface UseMatchRegistrationParameters {
  match: MatchRecord | null
}

export function useMatchRegistration({
  match,
}: UseMatchRegistrationParameters) {
  const queryClient = useQueryClient()
  const submittedMatchIdRef = useRef<string | null>(null)
  const [pendingMatches, setPendingMatches] = useState(loadPendingMatches)
  const mutation = useMutation({
    mutationFn: submitMatch,
    onSuccess: async (_response, submittedMatch) => {
      setPendingMatches(removePendingMatch(submittedMatch.matchId))
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ranking'] }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.history(submittedMatch.playerId, 1).slice(0, 2),
        }),
      ])
    },
    onError: (_error, failedMatch) => {
      setPendingMatches(savePendingMatch(failedMatch))
    },
  })

  useEffect(() => {
    if (!match || submittedMatchIdRef.current === match.matchId) {
      return
    }

    submittedMatchIdRef.current = match.matchId
    mutation.mutate(match)
  }, [match, mutation])

  const retryPendingMatch = (matchId: string) => {
    const pendingMatch = pendingMatches.find(
      (candidate) => candidate.matchId === matchId,
    )

    if (pendingMatch) {
      mutation.mutate(pendingMatch)
    }
  }

  return { mutation, pendingMatches, retryPendingMatch }
}
