import type {
  CcusageSessionRow,
  MessageEvent,
  CostedEvent,
  Coverage,
} from '../domain/types'

function weight(e: MessageEvent): number {
  const t = e.tokens
  return t.input + t.output + t.cacheCreation + t.cacheRead
}

export function allocateCost(
  sessions: CcusageSessionRow[],
  events: MessageEvent[],
): { costed: CostedEvent[]; coverage: Coverage } {
  const byId = new Map<string, CcusageSessionRow>()
  for (const s of sessions) byId.set(s.period, s)

  const bySession = new Map<string, MessageEvent[]>()
  for (const e of events) {
    const arr = bySession.get(e.sessionId) ?? []
    arr.push(e)
    bySession.set(e.sessionId, arr)
  }

  const costed: CostedEvent[] = []
  let matchedSessions = 0
  let matchedCost = 0
  const totalCost = sessions.reduce((a, s) => a + s.totalCost, 0)

  for (const [sid, evs] of bySession) {
    const sess = byId.get(sid)
    if (!sess) {
      for (const e of evs) costed.push({ ...e, cost: 0 })
      continue
    }
    matchedSessions++
    matchedCost += sess.totalCost

    const modelCost = new Map<string, number>()
    for (const b of sess.modelBreakdowns) modelCost.set(b.modelName, b.cost)

    const byModel = new Map<string, MessageEvent[]>()
    for (const e of evs) {
      const arr = byModel.get(e.model) ?? []
      arr.push(e)
      byModel.set(e.model, arr)
    }

    // Base cost per event. A listed model (present in modelBreakdowns AND
    // having events here) splits its own breakdown cost by token weight.
    // Unlisted-model events start at 0 and carry the remainder below.
    const costMap = new Map<MessageEvent, number>()
    for (const e of evs) costMap.set(e, 0)
    let assignedListed = 0
    const unmatchedEvents: MessageEvent[] = []
    for (const [model, mevs] of byModel) {
      if (modelCost.has(model)) {
        const pool = modelCost.get(model)!
        assignedListed += pool
        const totalW = mevs.reduce((a, e) => a + weight(e), 0)
        for (const e of mevs) {
          const share = totalW > 0 ? weight(e) / totalW : 1 / mevs.length
          costMap.set(e, pool * share)
        }
      } else {
        unmatchedEvents.push(...mevs)
      }
    }

    // Residual = session cost not yet assigned to a listed model that has
    // events. This absorbs unlisted-model cost AND phantom-breakdown / drift
    // residual (a listed model with no events, or Σ breakdowns != totalCost)
    // so the invariant Σ(allocated) == totalCost holds for every input shape.
    // Carriers: unlisted-model events if any; otherwise all session events.
    const residual = sess.totalCost - assignedListed
    const carriers = unmatchedEvents.length > 0 ? unmatchedEvents : evs
    const carrierW = carriers.reduce((a, e) => a + weight(e), 0)
    for (const e of carriers) {
      const share = carrierW > 0 ? weight(e) / carrierW : 1 / carriers.length
      costMap.set(e, costMap.get(e)! + residual * share)
    }

    for (const e of evs) costed.push({ ...e, cost: costMap.get(e)! })
  }

  return {
    costed,
    coverage: {
      totalSessions: bySession.size,
      matchedSessions,
      totalCost,
      matchedCost,
    },
  }
}
