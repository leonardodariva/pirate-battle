import { useState } from 'react'
import { createConfigKey } from '../../game/config/configKey'
import type { GameOptions } from '../../game/config/gameOptions'
import { useRankingQuery } from './useRankingQuery'

interface RankingScreenProps {
  options: GameOptions
  onBack: () => void
}

export function RankingScreen({ options, onBack }: RankingScreenProps) {
  const [page, setPage] = useState(1)
  const configKey = createConfigKey(options)
  const rankingQuery = useRankingQuery(configKey, page)
  const ranking = rankingQuery.data

  return (
    <main className="ranking-screen">
      <section className="ranking-card" aria-labelledby="ranking-title">
        <header className="ranking-header">
          <div>
            <p className="eyebrow">Hall of captains</p>
            <h1 id="ranking-title">Ranking</h1>
            <p className="ranking-config">
              {options.sessionDurationSeconds}s match · enemies every{' '}
              {options.enemySpawnIntervalSeconds}s
            </p>
          </div>
          <button className="secondary-button" onClick={onBack}>
            Back
          </button>
        </header>

        {rankingQuery.isPending && (
          <div className="ranking-state" role="status">
            Loading ranking...
          </div>
        )}

        {rankingQuery.isError && (
          <div className="ranking-state" role="alert">
            <p>Unable to load the ranking.</p>
            <button
              className="secondary-button"
              onClick={() => void rankingQuery.refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {ranking && ranking.items.length === 0 && (
          <div className="ranking-state">No matches for this configuration.</div>
        )}

        {ranking && ranking.items.length > 0 && (
          <>
            <div className="ranking-table-wrap">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Captain</th>
                    <th scope="col">Score</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.items.map((entry, index) => (
                    <tr key={entry.matchId}>
                      <td>{(ranking.page - 1) * ranking.pageSize + index + 1}</td>
                      <th scope="row">{entry.playerName}</th>
                      <td>{entry.score}</td>
                      <td>{entry.durationSeconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="ranking-pagination">
              <button
                className="secondary-button"
                disabled={page === 1 || rankingQuery.isFetching}
                onClick={() => setPage((currentPage) => currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {ranking.page} of {ranking.totalPages}
                {rankingQuery.isFetching ? ' · Refreshing...' : ''}
              </span>
              <button
                className="secondary-button"
                disabled={
                  page >= ranking.totalPages || rankingQuery.isFetching
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
