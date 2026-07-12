import { expect, test } from 'vitest'
import { buildSessionTimelineOption } from './sessionTimelineOption'
import type { CostedEvent } from '../../domain/types'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const ev = (ts: string, cost: number): CostedEvent => ({
  sessionId: 's', project: 'p', agent: 'claude', ts, model: 'm',
  tokens: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 }, cost,
})

test('cumulative cost line over message index', () => {
  const opt: any = buildSessionTimelineOption([ev('t1', 1), ev('t2', 2)], theme)
  expect(opt.series[0].type).toBe('line')
  expect(opt.series[0].data).toEqual([1, 3]) // cumulative
  expect(opt.legend).toBeUndefined()
})
