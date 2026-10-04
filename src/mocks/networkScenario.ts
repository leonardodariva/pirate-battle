export type NetworkScenario =
  | 'normal'
  | 'post-network-error'
  | 'post-timeout-after-commit'

export const NETWORK_SCENARIO_STORAGE_KEY =
  'pirate-battle:network-scenario'

export const NETWORK_SCENARIO_OPTIONS: ReadonlyArray<{
  value: NetworkScenario
  label: string
}> = [
  { value: 'normal', label: 'Normal' },
  { value: 'post-network-error', label: 'Match registration network error' },
  {
    value: 'post-timeout-after-commit',
    label: 'Match timeout after server commit',
  },
]

export function readNetworkScenario(): NetworkScenario {
  const storedScenario = window.localStorage.getItem(
    NETWORK_SCENARIO_STORAGE_KEY,
  )

  return storedScenario === 'post-network-error' ||
    storedScenario === 'post-timeout-after-commit'
    ? storedScenario
    : 'normal'
}

export function saveNetworkScenario(scenario: NetworkScenario) {
  window.localStorage.setItem(NETWORK_SCENARIO_STORAGE_KEY, scenario)
}
