import { expect, test } from 'vitest'
import { joinSessionMetrics, turnsPerPrompt } from './sessionMetrics'

const spans = [
  { sessionId: 'a', turns: 10, durationMs: 60_000 },
  { sessionId: 'b', turns: 4, durationMs: 0 },
  { sessionId: 'c', turns: 6, durationMs: 30_000 },
]
const prompts = [
  { sessionId: 'a', date: '2026-07-10', typed: 2, all: 5 },
  { sessionId: 'c', date: '2026-07-10', typed: 0, all: 3 }, // all-SDK session
]

test('joinSessionMetrics attaches prompt counts, defaulting missing to 0', () => {
  const m = joinSessionMetrics(spans, prompts)
  expect(m).toEqual([
    { sessionId: 'a', durationMs: 60_000, turns: 10, typed: 2, all: 5 },
    { sessionId: 'b', durationMs: 0, turns: 4, typed: 0, all: 0 }, // no prompt record
    { sessionId: 'c', durationMs: 30_000, turns: 6, typed: 0, all: 3 },
  ])
})

test('turnsPerPrompt = turns / typed, excluding sessions with 0 typed', () => {
  const m = joinSessionMetrics(spans, prompts)
  expect(turnsPerPrompt(m)).toEqual([5]) // only session a: 10/2; b & c have typed 0
})
