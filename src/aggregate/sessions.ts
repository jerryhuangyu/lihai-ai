import type { CostedEvent } from '../domain/types'

export interface SessionSummary {
  sessionId: string
  project: string
  agent: string
  gitBranch?: string
  cost: number
  tokens: number
  firstTs: string
  lastTs: string
  models: string[]
}

export function sessionSummaries(costed: CostedEvent[]): SessionSummary[] {
  const m = new Map<string, SessionSummary>()
  for (const e of costed) {
    const tok = e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead
    const cur = m.get(e.sessionId)
    if (!cur) {
      m.set(e.sessionId, {
        sessionId: e.sessionId, project: e.project, agent: e.agent, gitBranch: e.gitBranch,
        cost: e.cost, tokens: tok, firstTs: e.ts, lastTs: e.ts, models: [e.model],
      })
    } else {
      cur.cost += e.cost
      cur.tokens += tok
      if (e.ts < cur.firstTs) cur.firstTs = e.ts
      if (e.ts > cur.lastTs) cur.lastTs = e.ts
      if (!cur.models.includes(e.model)) cur.models.push(e.model)
    }
  }
  return [...m.values()].sort((a, b) => b.cost - a.cost)
}
