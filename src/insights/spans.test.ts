import { expect, test } from 'vitest'
import { sessionSpans, turnGaps, contextCurve } from './spans'
import type { CostedEvent } from '../domain/types'

const ev = (sessionId: string, ts: string, tokens?: Partial<CostedEvent['tokens']>): CostedEvent => ({
  sessionId, project: 'p', agent: 'claude', ts, model: 'm',
  tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, ...tokens }, cost: 0,
})

test('sessionSpans counts turns and wall-clock duration per session', () => {
  const spans = sessionSpans([
    ev('a', '2026-07-10T13:00:00.000Z'),
    ev('a', '2026-07-10T13:05:00.000Z'), // a: 2 turns, 5min
    ev('b', '2026-07-10T13:00:00.000Z'), // b: 1 turn, 0ms
  ]).sort((x, y) => x.sessionId.localeCompare(y.sessionId))
  expect(spans).toEqual([
    { sessionId: 'a', turns: 2, durationMs: 5 * 60_000 },
    { sessionId: 'b', turns: 1, durationMs: 0 },
  ])
})

test('turnGaps returns consecutive inter-turn gaps per session, flattened', () => {
  const gaps = turnGaps([
    ev('a', '2026-07-10T13:00:03.000Z'), // out of order on purpose
    ev('a', '2026-07-10T13:00:00.000Z'),
    ev('a', '2026-07-10T13:00:01.000Z'), // a sorted: 0,1,3 → gaps 1000, 2000
    ev('b', '2026-07-10T13:00:00.000Z'), // single turn → no gap
  ])
  expect(gaps.sort((x, y) => x - y)).toEqual([1000, 2000])
})

test('contextCurve orders by ts and sums the input side per turn', () => {
  const curve = contextCurve([
    ev('a', '2026-07-10T13:00:02.000Z', { input: 100, cacheRead: 8000, cacheCreation: 0, output: 999 }),
    ev('a', '2026-07-10T13:00:00.000Z', { input: 50, cacheRead: 0, cacheCreation: 2000, output: 1 }),
  ])
  expect(curve).toEqual([
    { i: 1, context: 2050 }, // earlier ts first; output excluded
    { i: 2, context: 8100 },
  ])
})
