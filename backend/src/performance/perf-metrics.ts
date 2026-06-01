export type ScenarioMeasurement = {
  latencyMs: number
  ok: boolean
}

export type LatencyStats = {
  count: number
  failed: number
  p50Ms: number
  p95Ms: number
  maxMs: number
}

export type ScenarioInput = {
  name: string
  thresholdP95Ms: number
  measurements: ScenarioMeasurement[]
}

export type ScenarioResult = LatencyStats & {
  name: string
  thresholdP95Ms: number
}

function percentile(sortedValues: number[], percentileValue: number): number {
  if (sortedValues.length === 0) {
    return 0
  }

  const rank = Math.ceil((percentileValue / 100) * sortedValues.length)
  const index = Math.max(rank - 1, 0)
  return sortedValues[index]
}

export function calculateLatencyStats(measurements: ScenarioMeasurement[]): LatencyStats {
  const sortedLatencies = measurements.map((measurement) => measurement.latencyMs).sort((a, b) => a - b)
  const failed = measurements.filter((measurement) => !measurement.ok).length
  const maxMs = sortedLatencies.length > 0 ? sortedLatencies[sortedLatencies.length - 1] : 0

  return {
    count: measurements.length,
    failed,
    p50Ms: percentile(sortedLatencies, 50),
    p95Ms: percentile(sortedLatencies, 95),
    maxMs,
  }
}

export function summarizeScenarioResult(input: ScenarioInput): ScenarioResult {
  return {
    name: input.name,
    thresholdP95Ms: input.thresholdP95Ms,
    ...calculateLatencyStats(input.measurements),
  }
}

export function assertScenarioWithinThreshold(result: ScenarioResult): void {
  if (result.failed > 0 || result.p95Ms > result.thresholdP95Ms) {
    throw new Error(
      `Performance scenario "${result.name}" failed: failed=${result.failed}, p95Ms=${result.p95Ms}, thresholdP95Ms=${result.thresholdP95Ms}`
    )
  }
}
