import type { CostedEvent } from '../domain/types'

// Restricts raw events to the sessions active within a date range, by SESSION
// ANCHOR (each session's latest event date), not per-event. A session is kept
// whole or dropped whole, so its span / turn count / context peak stay intact
// instead of being truncated at the range boundary. Mirrors promptStats.date,
// which also anchors a session to its last event day.
//
// 'all' resolves to [0000-01-01, 9999-12-31], so every real anchor falls in
// range and this returns the full set unchanged.
export function eventsInRange(
  events: CostedEvent[],
  range: { from: string; to: string },
): CostedEvent[] {
  const anchor = new Map<string, string>()
  for (const e of events) {
    const d = e.ts.slice(0, 10)
    const cur = anchor.get(e.sessionId)
    if (cur === undefined || d > cur) anchor.set(e.sessionId, d)
  }
  const inRange = new Set<string>()
  for (const [id, d] of anchor) if (d >= range.from && d <= range.to) inRange.add(id)
  return events.filter((e) => inRange.has(e.sessionId))
}
