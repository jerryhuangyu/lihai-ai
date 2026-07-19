import type { CostedEvent } from '../domain/types'

// Pure, on-demand insight functions over raw events (IndexedDB). Unlike
// aggregate/*, these are NOT persisted — they run at render time from
// useRawEvents(), so adding one never touches the persist schema. ts strings
// are parsed here (deterministic — no Date.now()), the way parsers/join do.

export interface SessionSpan {
  sessionId: string
  turns: number
  durationMs: number
}

/** Per-session turn count + wall-clock span (last ts − first ts). */
export function sessionSpans(events: CostedEvent[]): SessionSpan[] {
  const m = new Map<string, { turns: number; min: number; max: number }>()
  for (const e of events) {
    const t = Date.parse(e.ts)
    const cur = m.get(e.sessionId)
    if (!cur) m.set(e.sessionId, { turns: 1, min: t, max: t })
    else {
      cur.turns++
      if (t < cur.min) cur.min = t
      if (t > cur.max) cur.max = t
    }
  }
  return [...m.entries()].map(([sessionId, v]) => ({
    sessionId,
    turns: v.turns,
    durationMs: v.max - v.min,
  }))
}

/** Gaps (ms) between consecutive turns within each session, flattened across all
 *  sessions. Single-turn sessions contribute nothing. */
export function turnGaps(events: CostedEvent[]): number[] {
  const bySession = new Map<string, number[]>()
  for (const e of events) {
    const arr = bySession.get(e.sessionId) ?? []
    arr.push(Date.parse(e.ts))
    bySession.set(e.sessionId, arr)
  }
  const gaps: number[] = []
  for (const times of bySession.values()) {
    times.sort((a, b) => a - b)
    for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1])
  }
  return gaps
}

export interface ContextPoint {
  i: number // 1-based turn index
  context: number // input-side context that turn (input + cacheCreation + cacheRead)
}

/** Per-turn context-occupancy curve for one session's events (chronological). */
export function contextCurve(sessionEvents: CostedEvent[]): ContextPoint[] {
  return [...sessionEvents]
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((e, i) => ({
      i: i + 1,
      context: e.tokens.input + e.tokens.cacheCreation + e.tokens.cacheRead,
    }))
}
