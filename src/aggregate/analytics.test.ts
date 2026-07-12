import { expect, test } from 'vitest'
import {
  projectRanking, hourHeatmap, agentShare, modelEfficiency, sessionDistribution,
  costByTokenType,
} from './analytics'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'
import { modelRates } from '../pricing/outputRate'
import type { CostedEvent } from '../domain/types'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
const { costed } = allocateCost(n.session, toMessageEvents(SAMPLE_BUNDLE.sessions))

test('projectRanking aggregates cost + tokens by project', () => {
  const r = projectRanking(costed)
  expect(r).toEqual([{ project: 'app', cost: 3.0, tokens: 10600 }])
})

test('hourHeatmap buckets by weekday+hour (UTC) with days + lastDate', () => {
  const h = hourHeatmap(costed)
  // both events on 2026-07-10 (Friday=5), hours 13
  const cell = h.find((c) => c.weekday === 5 && c.hour === 13)!
  expect(cell.cost).toBeCloseTo(3.0, 6)
  expect(cell.days).toBe(1) // both events share the one calendar date
  expect(cell.lastDate).toBe('2026-07-10')
})

test('hourHeatmap counts distinct dates + reports the latest in a bucket', () => {
  const mk = (ts: string, cost: number): CostedEvent => ({
    sessionId: 's', project: 'p', agent: 'claude', ts, model: 'm',
    tokens: { input: 1, output: 0, cacheCreation: 0, cacheRead: 0 }, cost,
  })
  // three Fridays, all 13:00 UTC → same weekday+hour bucket, 3 distinct dates
  const cell = hourHeatmap([
    mk('2026-07-10T13:00:00.000Z', 1),
    mk('2026-07-17T13:10:00.000Z', 2),
    mk('2026-07-03T13:20:00.000Z', 1),
  ]).find((c) => c.weekday === 5 && c.hour === 13)!
  expect(cell.days).toBe(3)
  expect(cell.lastDate).toBe('2026-07-17') // most recent
  expect(cell.cost).toBeCloseTo(4.0, 6)
})

test('agentShare groups ccusage session rows by agent (not daily, which is always "all")', () => {
  const mkSession = (period: string, agent: string, cost: number) => ({
    period, agent, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
    totalTokens: 0, totalCost: cost, modelsUsed: [], modelBreakdowns: [],
  })
  const n = {
    daily: [{ period: '2026-07-10', agent: 'all', inputTokens: 0, outputTokens: 0,
      cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, totalCost: 5.0,
      modelsUsed: [], modelBreakdowns: [] }],
    weekly: [], monthly: [],
    session: [mkSession('s1', 'claude', 3.0), mkSession('s2', 'codex', 2.0), mkSession('s3', 'claude', 1.0)],
    blocks: [],
  }
  const r = agentShare(n)
  expect(r).toEqual([{ agent: 'claude', cost: 4.0 }, { agent: 'codex', cost: 2.0 }])
})

test('modelEfficiency computes $/1M output', () => {
  const e = modelEfficiency(n)[0]
  expect(e.model).toBe('claude-opus-4-8')
  expect(e.costPerMillionOutput).toBeCloseTo((3.0 / 2000) * 1e6, 6)
  expect(e.costPerMillionToken).toBeCloseTo((3.0 / 10600) * 1e6, 6)
  expect(e.outputShare).toBeCloseTo(2000 / 10600, 6)
})

test('sessionDistribution returns totals + percentiles', () => {
  const d = sessionDistribution(n)
  expect(d.totals).toEqual([10600])
  expect(d.p90).toBe(10600)
})

import { hourHeatmap as hm } from './analytics'
test('hourHeatmap shifts to local time by tzOffsetMinutes', () => {
  // event at 2026-07-10T23:30Z; tzOffset -480 (UTC+8) → local 07:31 Fri... compute:
  // local = UTC - offset(min). offset=-480 → local = 23:30 + 480min = 07:30 next day (Sat=6)
  const costed = [{
    sessionId: 's', project: 'p', agent: 'claude', ts: '2026-07-10T23:30:00.000Z',
    model: 'm', tokens: { input: 1, output: 0, cacheCreation: 0, cacheRead: 0 }, cost: 1,
  }]
  const cell = hm(costed, -480).find((c) => c.cost === 1)!
  expect(cell.weekday).toBe(6) // Saturday local
  expect(cell.hour).toBe(7)
})

// costByTokenType -----------------------------------------------------------

function mkCosted(model: string, tokens: Partial<CostedEvent['tokens']>, cost: number): CostedEvent {
  return {
    sessionId: 's', project: 'p', agent: 'claude', ts: '2026-07-10T13:00:00.000Z',
    model,
    tokens: { input: 0, output: 0, cacheCreation: 0, cacheRead: 0, ...tokens },
    cost,
  }
}

test('costByTokenType: sum of the 4 type costs equals sum of event costs', () => {
  const events = [
    mkCosted('claude-opus-4-8', { output: 1_000_000, cacheRead: 1_000_000 }, 51),
    mkCosted('totally-unknown-xyz', { output: 10, input: 90 }, 100),
    mkCosted('claude-opus-4-8', { input: 500, cacheCreation: 200 }, 7.5),
  ]
  const r = costByTokenType(events)
  const totalTypeCost = r.output.cost + r.cacheCreation.cost + r.cacheRead.cost + r.input.cost
  const totalEventCost = events.reduce((s, e) => s + e.cost, 0)
  expect(totalTypeCost).toBeCloseTo(totalEventCost, 6)
})

test('costByTokenType: proportional split by list-price ratio for a known model', () => {
  const { rates } = modelRates('claude-opus-4-8')
  if (!rates) throw new Error('expected known rates for claude-opus-4-8')
  const events = [mkCosted('claude-opus-4-8', { output: 1_000_000, cacheRead: 1_000_000 }, 51)]
  const r = costByTokenType(events)
  const wOut = 1_000_000 * rates.o
  const wCr = 1_000_000 * rates.cr
  const total = wOut + wCr
  expect(r.output.cost).toBeCloseTo(51 * (wOut / total), 6)
  expect(r.cacheRead.cost).toBeCloseTo(51 * (wCr / total), 6)
})

test('costByTokenType: unknown model falls back to raw-token weighting', () => {
  const events = [mkCosted('totally-unknown-xyz', { output: 10, input: 90 }, 100)]
  const r = costByTokenType(events)
  expect(r.output.cost).toBeCloseTo(10, 6)
  expect(r.input.cost).toBeCloseTo(90, 6)
})

test('costByTokenType: raw token volume accumulates across events regardless of price', () => {
  const events = [
    mkCosted('claude-opus-4-8', { output: 100, cacheRead: 50 }, 10),
    mkCosted('totally-unknown-xyz', { output: 20, input: 5 }, 1),
  ]
  const r = costByTokenType(events)
  expect(r.output.tokens).toBe(120)
  expect(r.cacheRead.tokens).toBe(50)
  expect(r.input.tokens).toBe(5)
  expect(r.cacheCreation.tokens).toBe(0)
})
