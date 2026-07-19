import type { BundleSession } from '../domain/types'

export interface PromptStat {
  sessionId: string
  date: string // YYYY-MM-DD of the session's last activity, for range slicing
  typed: number // human keyboard prompts
  all: number // all real prompts (typed + programmatic)
}

// Per-session prompt counts, straight from the bundle (build-bundle.mjs already
// classified them). `date` is the session's last event day so the range filter
// can slice by it (prompts have no per-prompt timestamp, so session granularity
// is the best available). Sessions with no real prompt are dropped. `?? 0`
// guards a v2 bundle that somehow omitted the counts.
export function promptStats(sessions: BundleSession[]): PromptStat[] {
  return sessions
    .map((s) => {
      let lastTs = ''
      for (const e of s.events) if (e.ts > lastTs) lastTs = e.ts
      return {
        sessionId: s.sessionId,
        date: lastTs.slice(0, 10),
        typed: s.typedPrompts ?? 0,
        all: s.allPrompts ?? 0,
      }
    })
    .filter((p) => p.all > 0)
}
