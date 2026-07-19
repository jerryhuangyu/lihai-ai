import { expect, test } from 'vitest'
import { buildAggregates } from './index'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

test('buildAggregates produces every card series', () => {
  const { aggregates, costed, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  expect(aggregates.dailyCost).toHaveLength(1)
  expect(aggregates.projectRanking[0].project).toBe('app')
  expect(aggregates.modelDaily.length).toBeGreaterThan(0)
  expect(aggregates.sessionMeta[0].date).toBe('2026-07-10') // from ccusage lastActivity
  expect(aggregates.costByTokenTypeDaily).toHaveLength(1) // sample has a single day
  expect(aggregates.kpis.totalCost).toBe(3.0)
  expect(costed).toHaveLength(2)
  expect(coverage.matchedSessions).toBe(1)
})
