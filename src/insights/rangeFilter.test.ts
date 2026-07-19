import { expect, test } from 'vitest'
import { eventsInRange } from './rangeFilter'
import type { CostedEvent } from '../domain/types'

const mk = (sessionId: string, ts: string): CostedEvent => ({
  sessionId, project: 'p', agent: 'claude', ts, model: 'm',
  tokens: { input: 1, output: 0, cacheCreation: 0, cacheRead: 0 }, cost: 0,
})

test('keeps whole sessions whose anchor (latest event date) is in range', () => {
  const events = [
    mk('a', '2026-07-01T09:00:00.000Z'), // session a: last activity 07-02
    mk('a', '2026-07-02T09:00:00.000Z'),
    mk('b', '2026-07-05T09:00:00.000Z'), // session b: last activity 07-05
  ]
  const r = eventsInRange(events, { from: '2026-07-04', to: '2026-07-31' })
  expect(r.map((e) => e.sessionId)).toEqual(['b']) // a's anchor 07-02 is out of range
})

test('an in-range anchor pulls in the session’s earlier out-of-range events too', () => {
  const events = [
    mk('a', '2026-07-01T09:00:00.000Z'), // before range.from
    mk('a', '2026-07-10T09:00:00.000Z'), // anchor in range
  ]
  const r = eventsInRange(events, { from: '2026-07-08', to: '2026-07-31' })
  expect(r).toHaveLength(2) // whole session kept, span not truncated
})

test("'all' sentinel range returns everything unchanged", () => {
  const events = [mk('a', '2020-01-01T00:00:00.000Z'), mk('b', '2030-01-01T00:00:00.000Z')]
  expect(eventsInRange(events, { from: '0000-01-01', to: '9999-12-31' })).toHaveLength(2)
})

test('empty input yields empty output', () => {
  expect(eventsInRange([], { from: '2026-07-01', to: '2026-07-31' })).toEqual([])
})
