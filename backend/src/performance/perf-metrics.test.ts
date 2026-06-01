import { describe, expect, it } from 'vitest'

import {
  assertScenarioWithinThreshold,
  calculateLatencyStats,
  summarizeScenarioResult,
  type ScenarioMeasurement,
} from './perf-metrics.js'

describe('performance metrics helpers', () => {
  it('calculates count, failures, percentiles, and max latency', () => {
    const measurements: ScenarioMeasurement[] = [
      { latencyMs: 100, ok: true },
      { latencyMs: 500, ok: false },
      { latencyMs: 200, ok: true },
      { latencyMs: 300, ok: true },
      { latencyMs: 400, ok: true },
    ]

    expect(calculateLatencyStats(measurements)).toEqual({
      count: 5,
      failed: 1,
      p50Ms: 300,
      p95Ms: 500,
      maxMs: 500,
    })
  })

  it('formats scenario summaries for report output', () => {
    const result = summarizeScenarioResult({
      name: '报名高峰',
      thresholdP95Ms: 3000,
      measurements: [
        { latencyMs: 120, ok: true },
        { latencyMs: 180, ok: true },
      ],
    })

    expect(result).toEqual({
      name: '报名高峰',
      thresholdP95Ms: 3000,
      count: 2,
      failed: 0,
      p50Ms: 120,
      p95Ms: 180,
      maxMs: 180,
    })
  })

  it('raises a clear error when a scenario has failures or crosses the p95 threshold', () => {
    const result = summarizeScenarioResult({
      name: '签到高峰',
      thresholdP95Ms: 3000,
      measurements: [
        { latencyMs: 1200, ok: true },
        { latencyMs: 3200, ok: false },
      ],
    })

    expect(() => assertScenarioWithinThreshold(result)).toThrow(
      'Performance scenario "签到高峰" failed: failed=1, p95Ms=3200, thresholdP95Ms=3000'
    )
  })
})
