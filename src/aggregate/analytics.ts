import type { CcusageNormalized, CostedEvent } from '../domain/types'
import { modelRates } from '../pricing/outputRate'

export function projectRanking(costed: CostedEvent[]) {
  const m = new Map<string, { cost: number; tokens: number }>()
  for (const e of costed) {
    const cur = m.get(e.project) ?? { cost: 0, tokens: 0 }
    cur.cost += e.cost
    cur.tokens += e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead
    m.set(e.project, cur)
  }
  return [...m.entries()]
    .map(([project, v]) => ({ project, ...v }))
    .sort((a, b) => b.cost - a.cost)
}

export function hourHeatmap(costed: CostedEvent[], tzOffsetMinutes = 0) {
  const m = new Map<string, { cost: number; dates: Set<string> }>()
  for (const e of costed) {
    // local = UTC shifted by -offset (getTimezoneOffset: minutes to add to local → UTC)
    const local = new Date(new Date(e.ts).getTime() - tzOffsetMinutes * 60_000)
    const key = `${local.getUTCDay()}:${local.getUTCHours()}`
    const cur = m.get(key) ?? { cost: 0, dates: new Set<string>() }
    cur.cost += e.cost
    cur.dates.add(local.toISOString().slice(0, 10)) // local calendar date
    m.set(key, cur)
  }
  return [...m.entries()].map(([k, v]) => {
    const [weekday, hour] = k.split(':').map(Number)
    // ISO date strings sort lexically == chronologically, so max() is the latest.
    const lastDate = [...v.dates].reduce((a, b) => (b > a ? b : a), '')
    // days = how many distinct calendar dates land in this weekday+hour bucket,
    // so the tooltip can say "N days active" instead of implying a single date.
    return { weekday, hour, cost: v.cost, days: v.dates.size, lastDate }
  })
}

export interface SessionMetaRow {
  date: string // session's last-activity day (YYYY-MM-DD)
  agent: string
  totalTokens: number
  cost: number
}

// Per-session rollup from ccusage SESSION rows, carrying each session's
// last-activity date so agent-share and session-distribution can be sliced by
// the date-range filter. Session rows are the right source for both: they cover
// ALL agents' cost (claude/codex/gemini/...), whereas daily rows are always
// agent='all' and JSONL-derived costed events are Claude-only.
//
// A session with no derivable date gets a far-past sentinel ('0001-01-01') so
// it still appears in the unfiltered 'all' view (preserving prior totals) but
// falls outside every real preset window (it can't be placed on the timeline).
export function sessionMeta(n: CcusageNormalized): SessionMetaRow[] {
  return n.session.map((s) => ({
    date: s.lastActivity ? s.lastActivity.slice(0, 10) : '0001-01-01',
    agent: s.agent,
    totalTokens: s.totalTokens,
    cost: s.totalCost,
  }))
}

export function agentShareFrom(rows: SessionMetaRow[]) {
  const m = new Map<string, number>()
  for (const s of rows) m.set(s.agent, (m.get(s.agent) ?? 0) + s.cost)
  return [...m.entries()]
    .map(([agent, cost]) => ({ agent, cost }))
    .sort((a, b) => b.cost - a.cost)
}

// modelEfficiency moved to aggregate/modelDaily.ts (modelEfficiencyFromDaily),
// which computes it from range-sliceable per-date rows instead of the whole
// dataset, so the card can respond to the date-range filter.

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

// Peak per-request context per session: for each event, the input side that
// the model had to read that turn (input + cacheCreation + cacheRead — output
// is generated, not part of the prompt context), then the max across the
// session's events. This is the quantity the context window actually bounds,
// unlike sessionDistribution's cumulative session totals. Sessions whose peak
// is 0 (no input recorded) are dropped.
export function sessionContextPeak(costed: CostedEvent[]) {
  const peakBySession = new Map<string, number>()
  for (const e of costed) {
    const ctx = e.tokens.input + e.tokens.cacheCreation + e.tokens.cacheRead
    peakBySession.set(e.sessionId, Math.max(peakBySession.get(e.sessionId) ?? 0, ctx))
  }
  const peaks = [...peakBySession.values()].filter((v) => v > 0)
  return { peaks }
}

export function sessionDistributionFrom(rows: SessionMetaRow[]) {
  // Drop 0-token sessions: they carry no context signal and only pile up in
  // bin 0, drowning the real distribution. Excluded from percentiles too.
  const totals = rows.map((s) => s.totalTokens).filter((t) => t > 0)
  const sorted = [...totals].sort((a, b) => a - b)
  return { totals, p50: percentile(sorted, 50), p90: percentile(sorted, 90) }
}

export interface TokenTypeSplit {
  cost: number
  tokens: number
}

export interface CostByTokenType {
  output: TokenTypeSplit
  cacheCreation: TokenTypeSplit
  cacheRead: TokenTypeSplit
  input: TokenTypeSplit
}

// Splits each event's already-allocated dollar cost across the 4 token types
// by list-price ratio (weight = tokenCount * $/1M rate), so the split answers
// "where does the money go" rather than "where do raw tokens go". Unknown
// models (rates === null) fall back to weighting by raw token count (rate=1
// each) — degenerate, but keeps the cost-conservation invariant and unknown
// models are rare. Raw token volume is always accumulated regardless of W,
// so the "tokens" side of the card is never affected by pricing gaps.
export function costByTokenType(costed: CostedEvent[]): CostByTokenType {
  const out: CostByTokenType = {
    output: { cost: 0, tokens: 0 },
    cacheCreation: { cost: 0, tokens: 0 },
    cacheRead: { cost: 0, tokens: 0 },
    input: { cost: 0, tokens: 0 },
  }
  for (const e of costed) {
    const { rates } = modelRates(e.model)
    const t = e.tokens
    const wOutput = t.output * (rates ? rates.o : 1)
    const wCacheCreation = t.cacheCreation * (rates ? rates.cc : 1)
    const wCacheRead = t.cacheRead * (rates ? rates.cr : 1)
    const wInput = t.input * (rates ? rates.i : 1)
    const total = wOutput + wCacheCreation + wCacheRead + wInput
    if (total > 0) {
      out.output.cost += (e.cost * wOutput) / total
      out.cacheCreation.cost += (e.cost * wCacheCreation) / total
      out.cacheRead.cost += (e.cost * wCacheRead) / total
      out.input.cost += (e.cost * wInput) / total
    }
    out.output.tokens += t.output
    out.cacheCreation.tokens += t.cacheCreation
    out.cacheRead.tokens += t.cacheRead
    out.input.tokens += t.input
  }
  return out
}

export interface CostByTokenTypeDailyRow extends CostByTokenType {
  date: string
}

// Per-date cost split, so the card can slice by date range then sum. Summing
// per-date splits is EXACT vs a full-range recompute: each split is a per-event
// dollar allocation, and grouping those allocations by date before summing
// changes nothing. Persisting this (vs recomputing from IndexedDB) keeps the
// card's slice synchronous, matching dailyCost.
export function costByTokenTypeDaily(costed: CostedEvent[]): CostByTokenTypeDailyRow[] {
  const byDate = new Map<string, CostedEvent[]>()
  for (const e of costed) {
    const d = e.ts.slice(0, 10)
    const arr = byDate.get(d)
    if (arr) arr.push(e)
    else byDate.set(d, [e])
  }
  return [...byDate.entries()]
    .map(([date, events]) => ({ date, ...costByTokenType(events) }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function sumCostByTokenType(rows: CostByTokenType[]): CostByTokenType {
  const out: CostByTokenType = {
    output: { cost: 0, tokens: 0 },
    cacheCreation: { cost: 0, tokens: 0 },
    cacheRead: { cost: 0, tokens: 0 },
    input: { cost: 0, tokens: 0 },
  }
  for (const r of rows) {
    for (const k of ['output', 'cacheCreation', 'cacheRead', 'input'] as const) {
      out[k].cost += r[k].cost
      out[k].tokens += r[k].tokens
    }
  }
  return out
}
