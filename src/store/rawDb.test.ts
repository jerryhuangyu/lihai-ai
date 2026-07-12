import 'fake-indexeddb/auto'
import { expect, test, beforeEach } from 'vitest'
import { saveEvents, eventsBySession, clearEvents, allEvents } from './rawDb'
import type { CostedEvent } from '../domain/types'

const ev: CostedEvent[] = [
  { sessionId: 's1', project: 'app', agent: 'claude', ts: 't', model: 'm',
    tokens: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 }, cost: 0.5 },
  { sessionId: 's2', project: 'app', agent: 'claude', ts: 't', model: 'm',
    tokens: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 }, cost: 0.5 },
]

beforeEach(async () => { await clearEvents() })

test('saveEvents then query by session', async () => {
  await saveEvents(ev)
  const got = await eventsBySession('s1')
  expect(got).toHaveLength(1)
  expect(got[0].cost).toBe(0.5)
})

test('saveEvents replaces prior data', async () => {
  await saveEvents(ev)
  await saveEvents([ev[0]])
  expect(await eventsBySession('s2')).toHaveLength(0)
})

test('allEvents returns everything saved', async () => {
  await saveEvents(ev)
  expect(await allEvents()).toHaveLength(ev.length)
})
