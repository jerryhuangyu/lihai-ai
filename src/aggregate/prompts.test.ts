import { expect, test } from 'vitest'
import { promptStats } from './prompts'
import type { BundleSession } from '../domain/types'

const ev = (ts: string) => ({ ts, model: 'm', usage: { input_tokens: 1, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } })
const s = (sessionId: string, typedPrompts: number, allPrompts: number, lastTs = '2026-07-10T13:00:00.000Z'): BundleSession => ({
  sessionId, project: '/p', events: [ev('2026-07-10T12:00:00.000Z'), ev(lastTs)], typedPrompts, allPrompts,
})

test('promptStats maps counts + last-activity date, dropping promptless sessions', () => {
  const r = promptStats([s('a', 3, 5, '2026-07-11T09:00:00.000Z'), s('b', 0, 0), s('c', 2, 2)])
  expect(r).toEqual([
    { sessionId: 'a', date: '2026-07-11', typed: 3, all: 5 }, // date from the later event
    { sessionId: 'c', date: '2026-07-10', typed: 2, all: 2 },
  ])
})

test('promptStats defaults missing counts to 0 (malformed/partial bundle)', () => {
  const r = promptStats([{ sessionId: 'a', project: '/p', events: [ev('2026-07-10T13:00:00.000Z')] }])
  expect(r).toEqual([]) // all = 0 → dropped
})
