import { expect, test } from 'vitest'
import { sessionSummaries } from './sessions'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
const { costed } = allocateCost(n.session, toMessageEvents(SAMPLE_BUNDLE.sessions))

test('rolls up per-session cost, tokens, ts span, models', () => {
  const s = sessionSummaries(costed)
  expect(s[0]).toMatchObject({ sessionId: 'sess-A', project: 'app', agent: 'claude' })
  expect(s[0].cost).toBeCloseTo(3.0, 6)
  expect(s[0].tokens).toBe(10600)
  expect(s[0].firstTs <= s[0].lastTs).toBe(true)
  expect(s[0].models).toContain('claude-opus-4-8')
})
