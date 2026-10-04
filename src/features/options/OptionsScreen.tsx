import { useState, type FormEvent } from 'react'
import {
  GAME_OPTION_LIMITS,
  validateGameOptions,
  type GameOptions,
  type GameOptionsErrors,
} from '../../game/config/gameOptions'
import {
  NETWORK_SCENARIO_OPTIONS,
  type NetworkScenario,
} from '../../mocks/networkScenario'

interface OptionsScreenProps {
  options: GameOptions
  networkScenario: NetworkScenario
  onSave: (options: GameOptions, networkScenario: NetworkScenario) => void
  onResetMockData: () => void
  onCancel: () => void
}

export function OptionsScreen({
  options,
  networkScenario,
  onSave,
  onResetMockData,
  onCancel,
}: OptionsScreenProps) {
  const [draft, setDraft] = useState(options)
  const [scenarioDraft, setScenarioDraft] = useState(networkScenario)
  const [errors, setErrors] = useState<GameOptionsErrors>({})

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateGameOptions(draft)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      onSave(draft, scenarioDraft)
    }
  }

  return (
    <main className="options-screen">
      <section className="options-card" aria-labelledby="options-title">
        <p className="eyebrow">Match setup</p>
        <h1 id="options-title">Options</h1>
        <p className="options-intro">
          These values are copied when a new match begins.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-field">
            <label htmlFor="session-duration">Game session time</label>
            <span>From 60 to 180 seconds</span>
            <input
              id="session-duration"
              name="sessionDurationSeconds"
              type="number"
              min={GAME_OPTION_LIMITS.sessionDurationSeconds.minimum}
              max={GAME_OPTION_LIMITS.sessionDurationSeconds.maximum}
              step="1"
              value={draft.sessionDurationSeconds}
              aria-invalid={Boolean(errors.sessionDurationSeconds)}
              aria-describedby={
                errors.sessionDurationSeconds
                  ? 'session-duration-error'
                  : undefined
              }
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  sessionDurationSeconds: Number(event.target.value),
                }))
              }
            />
            {errors.sessionDurationSeconds && (
              <strong
                id="session-duration-error"
                className="field-error"
                role="alert"
              >
                {errors.sessionDurationSeconds}
              </strong>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="spawn-interval">Enemy spawn time</label>
            <span>From 1 to 20 seconds</span>
            <input
              id="spawn-interval"
              name="enemySpawnIntervalSeconds"
              type="number"
              min={GAME_OPTION_LIMITS.enemySpawnIntervalSeconds.minimum}
              max={GAME_OPTION_LIMITS.enemySpawnIntervalSeconds.maximum}
              step="1"
              value={draft.enemySpawnIntervalSeconds}
              aria-invalid={Boolean(errors.enemySpawnIntervalSeconds)}
              aria-describedby={
                errors.enemySpawnIntervalSeconds
                  ? 'spawn-interval-error'
                  : undefined
              }
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  enemySpawnIntervalSeconds: Number(event.target.value),
                }))
              }
            />
            {errors.enemySpawnIntervalSeconds && (
              <strong
                id="spawn-interval-error"
                className="field-error"
                role="alert"
              >
                {errors.enemySpawnIntervalSeconds}
              </strong>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="network-scenario">Mock network scenario</label>
            <span>Used to demonstrate registration failures safely</span>
            <select
              id="network-scenario"
              value={scenarioDraft}
              onChange={(event) =>
                setScenarioDraft(event.target.value as NetworkScenario)
              }
            >
              {NETWORK_SCENARIO_OPTIONS.map((scenario) => (
                <option key={scenario.value} value={scenario.value}>
                  {scenario.label}
                </option>
              ))}
            </select>
          </div>

          <div className="options-actions">
            <button className="primary-button" type="submit">
              Save
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onCancel}
            >
              Back
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={onResetMockData}
            >
              Reset mock data
            </button>
          </div>
        </form>
      </section>
    </main>
  )
}
