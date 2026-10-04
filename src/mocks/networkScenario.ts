export type NetworkScenario = 'normal' | 'post-network-error'

export const NETWORK_SCENARIO_STORAGE_KEY =
  'pirate-battle:network-scenario'

export function readNetworkScenario(): NetworkScenario {
  const storedScenario = window.localStorage.getItem(
    NETWORK_SCENARIO_STORAGE_KEY,
  )

  return storedScenario === 'post-network-error' ? storedScenario : 'normal'
}
