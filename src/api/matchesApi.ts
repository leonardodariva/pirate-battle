import { httpClient } from './httpClient'
import type { MatchRecord, SubmitMatchResponse } from './types'

export async function submitMatch(match: MatchRecord) {
  const response = await httpClient.post<SubmitMatchResponse>('/matches', match)
  return response.data
}
