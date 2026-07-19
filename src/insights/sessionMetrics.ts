import type { SessionSpan } from './spans'
import type { PromptStat } from '../aggregate/prompts'

export interface SessionMetric {
  sessionId: string
  durationMs: number
  turns: number // model requests
  typed: number // human prompts
  all: number // all prompts
}

// Join the on-demand event metrics (turns, duration — from IndexedDB) with the
// persisted per-session prompt counts (from the bundle). Spans is the base set;
// sessions with no prompt record default to 0.
export function joinSessionMetrics(spans: SessionSpan[], prompts: PromptStat[]): SessionMetric[] {
  const byId = new Map(prompts.map((p) => [p.sessionId, p]))
  return spans.map((s) => {
    const p = byId.get(s.sessionId)
    return {
      sessionId: s.sessionId,
      durationMs: s.durationMs,
      turns: s.turns,
      typed: p?.typed ?? 0,
      all: p?.all ?? 0,
    }
  })
}

// Agentic depth: model requests per human-typed prompt. Undefined without human
// input, so sessions with no typed prompt are excluded.
export function turnsPerPrompt(metrics: SessionMetric[]): number[] {
  return metrics.filter((m) => m.typed > 0).map((m) => m.turns / m.typed)
}
