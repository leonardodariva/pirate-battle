import { useState } from 'react'
import type { MatchEndReason } from '../../api/types'
import type { PlayerIdentity } from '../../storage/playerIdentityStorage'
import { useMatchHistoryQuery } from './useMatchHistoryQuery'

interface MatchHistoryScreenProps {
  player: PlayerIdentity
  onBack: () => void
}

const dateFormatter = new Intl.DateTimeFormat('en', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

export function MatchHistoryScreen({
  player,
  onBack,
}: MatchHistoryScreenProps) {
  const [page, setPage] = useState(1)
  const historyQuery = useMatchHistoryQuery(player.playerId, page)
  const history = historyQuery.data

  return (
    <main className="ranking-screen">
      <section className="ranking-card" aria-labelledby="history-title">
        <header className="ranking-header">
          <div>
            <p className="eyebrow">Captain's log</p>
            <h1 id="history-title">Match History</h1>
            <p className="ranking-config">Completed matches for {player.playerName}</p>
          </div>
          <button className="secondary-button" onClick={onBack}>
            Back
          </button>
        </header>

        {historyQuery.isPending && (
          <div className="ranking-state" role="status">
            Loading match history...
          </div>
        )}

        {historyQuery.isError && (
          <div className="ranking-state" role="alert">
            <p>Unable to load match history.</p>
            <button
              className="secondary-button"
              onClick={() => void historyQuery.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {history && history.items.length === 0 && (
          <div className="ranking-state">No completed matches yet.</div>
        )}

        {history && history.items.length > 0 && (
          <>
            <div className="ranking-table-wrap">
              <table className="ranking-table history-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Score</th>
                    <th scope="col">Played</th>
                    <th scope="col">Result</th>
                    <th scope="col">Configuration</th>
                  </tr>
                </thead>
                <tbody>
                  {history.items.map((entry) => (
                    <tr key={entry.matchId}>
                      <th scope="row">
                        <time dateTime={entry.completedAt}>
                          {dateFormatter.format(new Date(entry.completedAt))}
                        </time>
                      </th>
                      <td>{entry.score}</td>
                      <td>{entry.durationSeconds}s</td>
                      <td>{formatEndReason(entry.endReason)}</td>
                      <td>
                        {entry.configuration.sessionDurationSeconds}s ·{' '}
                        {entry.configuration.enemySpawnIntervalSeconds}s spawn
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="ranking-pagination">
              <button
                className="secondary-button"
                disabled={page === 1 || historyQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {history.page} of {history.totalPages}
                {historyQuery.isFetching ? ' · Refreshing...' : ''}
              </span>
              <button
                className="secondary-button"
                disabled={
                  page >= history.totalPages || historyQuery.isFetching
                }
                onClick={() => setPage((currentPage) => currentPage + 1)}
              >
                Next
              </button>
            </footer>
          </>
        )}
      </section>
    </main>
  )
}

function formatEndReason(endReason: MatchEndReason) {
  return endReason === 'timeout' ? 'Time up' : 'Ship destroyed'
}
