import { expect, test } from 'vitest'
import { recomputeEventCards } from './recompute'
import type { CostedEvent } from '../../domain/types'

const ev = (ts: string, project: string, cost: number): CostedEvent => ({
  sessionId: 's', project, agent: 'claude', ts, model: 'm',
  tokens: { input: 1, output: 0, cacheCreation: 0, cacheRead: 0 }, cost,
})

test('filters events by ts date within range then re-aggregates', () => {
  const events = [ev('2026-07-01T10:00:00Z', 'a', 5), ev('2026-07-20T10:00:00Z', 'b', 7)]
  const out = recomputeEventCards(events, { from: '2026-07-15', to: '2026-07-31' }, 0)
  expect(out.projectRanking).toEqual([{ project: 'b', cost: 7, tokens: 1 }])
  expect(out.hourHeatmap.reduce((a, c) => a + c.cost, 0)).toBeCloseTo(7, 6)
})
