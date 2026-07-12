import { expect, test } from 'vitest'
import { allocateCost } from './allocateCost'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
const ev = toMessageEvents(SAMPLE_BUNDLE.sessions)

test('allocated cost sums to session totalCost (invariant)', () => {
  const { costed } = allocateCost(n.session, ev)
  const total = costed.reduce((a, e) => a + e.cost, 0)
  expect(total).toBeCloseTo(3.0, 6)
})

test('allocation is proportional to token weight', () => {
  const { costed } = allocateCost(n.session, ev)
  // event0 weight = 40+800+200+3000 = 4040; event1 = 60+1200+300+5000 = 6560; total 10600
  expect(costed[0].cost).toBeCloseTo(3.0 * (4040 / 10600), 6)
  expect(costed[1].cost).toBeCloseTo(3.0 * (6560 / 10600), 6)
})

test('unmatched session gets zero cost and lowers coverage', () => {
  const orphanEvents = toMessageEvents([
    { sessionId: 'ghost', project: '/p', events: [
      { ts: 't', model: 'm', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    ] },
  ])
  const { costed, coverage } = allocateCost(n.session, [...ev, ...orphanEvents])
  const ghost = costed.find((e) => e.sessionId === 'ghost')!
  expect(ghost.cost).toBe(0)
  expect(coverage.matchedSessions).toBe(1)
  expect(coverage.totalSessions).toBe(2)
})

test('zero-token model splits equally to avoid div-by-zero', () => {
  const sessions = [{
    period: 's0', agent: 'claude', inputTokens: 0, outputTokens: 0,
    cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, totalCost: 2.0,
    modelsUsed: ['m'], modelBreakdowns: [{ modelName: 'm', cost: 2.0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }],
  }]
  const events = toMessageEvents([{ sessionId: 's0', project: '/p', events: [
    { ts: 't1', model: 'm', usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    { ts: 't2', model: 'm', usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
  ] }])
  const { costed } = allocateCost(sessions, events)
  expect(costed[0].cost).toBeCloseTo(1.0, 6)
  expect(costed[1].cost).toBeCloseTo(1.0, 6)
})

test('mixed matched/unmatched model splits the remainder (invariant holds)', () => {
  const sessions = [{
    period: 's-mix', agent: 'claude',
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
    totalTokens: 0, totalCost: 5.0, modelsUsed: ['A'],
    modelBreakdowns: [{ modelName: 'A', cost: 3.0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }],
  }]
  const events = toMessageEvents([{ sessionId: 's-mix', project: '/p', events: [
    { ts: 't1', model: 'A', usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    { ts: 't2', model: 'A', usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    { ts: 't3', model: 'B', usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
  ] }])
  const { costed } = allocateCost(sessions, events)
  const total = costed.reduce((a, e) => a + e.cost, 0)
  expect(total).toBeCloseTo(5.0, 6)          // invariant
  const b = costed.find((e) => e.model === 'B')!
  expect(b.cost).toBeCloseTo(2.0, 6)         // remainder = 5.0 - 3.0
  const aTotal = costed.filter((e) => e.model === 'A').reduce((a, e) => a + e.cost, 0)
  expect(aTotal).toBeCloseTo(3.0, 6)
})

test('phantom breakdown model with no events: residual absorbed, invariant holds', () => {
  const sessions = [{
    period: 's-ph', agent: 'claude',
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
    totalTokens: 0, totalCost: 5.0, modelsUsed: ['A', 'X'],
    modelBreakdowns: [
      { modelName: 'A', cost: 3.0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
      { modelName: 'X', cost: 2.0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 },
    ],
  }]
  const events = toMessageEvents([{ sessionId: 's-ph', project: '/p', events: [
    { ts: 't1', model: 'A', usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    { ts: 't2', model: 'A', usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
  ] }])
  const { costed } = allocateCost(sessions, events)
  expect(costed.reduce((a, e) => a + e.cost, 0)).toBeCloseTo(5.0, 6)
})

test('two unlisted models pool one remainder by weight (invariant)', () => {
  const sessions = [{
    period: 's-two', agent: 'claude',
    inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
    totalTokens: 0, totalCost: 4.0, modelsUsed: [], modelBreakdowns: [],
  }]
  const events = toMessageEvents([{ sessionId: 's-two', project: '/p', events: [
    { ts: 't1', model: 'B', usage: { input_tokens: 300, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    { ts: 't2', model: 'C', usage: { input_tokens: 100, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
  ] }])
  const { costed } = allocateCost(sessions, events)
  expect(costed.reduce((a, e) => a + e.cost, 0)).toBeCloseTo(4.0, 6)
  expect(costed.find((e) => e.model === 'B')!.cost).toBeCloseTo(3.0, 6)
  expect(costed.find((e) => e.model === 'C')!.cost).toBeCloseTo(1.0, 6)
})
