import { describe, expect, it } from 'vitest'
import { createConfigKey } from './configKey'

describe('createConfigKey', () => {
  it('is deterministic for equivalent options', () => {
    const options = {
      sessionDurationSeconds: 120,
      enemySpawnIntervalSeconds: 5,
    }

    expect(createConfigKey(options)).toBe(createConfigKey({ ...options }))
    expect(createConfigKey(options)).toBe('v1:duration=120:spawn=5')
  })

  it('changes when a ranking-relevant option changes', () => {
    expect(
      createConfigKey({
        sessionDurationSeconds: 120,
        enemySpawnIntervalSeconds: 5,
      }),
    ).not.toBe(
      createConfigKey({
        sessionDurationSeconds: 180,
        enemySpawnIntervalSeconds: 5,
      }),
    )
  })
})
