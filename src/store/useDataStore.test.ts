import { expect, test, beforeEach } from 'vitest'
import { useDataStore } from './useDataStore'
import { buildAggregates } from '../aggregate'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

beforeEach(() => useDataStore.getState().reset())

test('setResult stores aggregates + coverage', () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: '2026-07-11T00:00:00.000Z' })
  expect(useDataStore.getState().aggregates?.kpis.totalCost).toBe(3.0)
  expect(useDataStore.getState().coverage?.matchedSessions).toBe(1)
})

test('reset clears state', () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: '2026-07-11T00:00:00.000Z' })
  expect(useDataStore.getState().aggregates).not.toBeNull()

  useDataStore.getState().reset()

  expect(useDataStore.getState().aggregates).toBeNull()
  expect(useDataStore.getState().coverage).toBeNull()
  expect(useDataStore.getState().generatedAt).toBeNull()
})
