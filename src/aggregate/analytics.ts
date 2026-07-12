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

// Per-agent cost comes from ccusage SESSION rows: each session carries a real
// agent (claude/codex/gemini/...), whereas daily rows are always agent='all'.
// Session is also the right source because it covers ALL agents' cost, while
// JSONL-derived costed events are Claude-only.
export function agentShare(n: CcusageNormalized) {
  const m = new Map<string, number>()
  for (const s of n.session) m.set(s.agent, (m.get(s.agent) ?? 0) + s.totalCost)
  return [...m.entries()]
    .map(([agent, cost]) => ({ agent, cost }))
    .sort((a, b) => b.cost - a.cost)
}

export function modelEfficiency(n: CcusageNormalized) {
  const m = new Map<string, { cost: number; output: number; total: number }>()
  for (const r of n.daily) {
    for (const b of r.modelBreakdowns) {
      const cur = m.get(b.modelName) ?? { cost: 0, output: 0, total: 0 }
      cur.cost += b.cost
      cur.output += b.outputTokens
      cur.total += b.inputTokens + b.outputTokens + b.cacheCreationTokens + b.cacheReadTokens
      m.set(b.modelName, cur)
    }
  }
  return [...m.entries()]
    .map(([model, v]) => ({
      model,
      costPerMillionOutput: v.output > 0 ? (v.cost / v.output) * 1e6 : 0,
      costPerMillionToken: v.total > 0 ? (v.cost / v.total) * 1e6 : 0,
      outputShare: v.total > 0 ? v.output / v.total : 0,
    }))
    .sort((a, b) => a.costPerMillionToken - b.costPerMillionToken)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

export function sessionDistribution(n: CcusageNormalized) {
  const totals = n.session.map((s) => s.totalTokens)
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
