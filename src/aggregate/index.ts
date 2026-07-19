import type { Bundle, CostedEvent, Coverage } from '../domain/types'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { dailyCost, tokenComposition, cacheTrend, modelTimeline } from './timeseries'
import { projectRanking, hourHeatmap, sessionMeta, costByTokenTypeDaily } from './analytics'
import { kpis, activeBlock, monthEndProjection } from './kpi'
import { modelDaily } from './modelDaily'
import { sessionSummaries } from './sessions'
import { promptStats } from './prompts'

export interface Aggregates {
  dailyCost: ReturnType<typeof dailyCost>
  tokenComposition: ReturnType<typeof tokenComposition>
  cacheTrend: ReturnType<typeof cacheTrend>
  modelTimeline: ReturnType<typeof modelTimeline>
  projectRanking: ReturnType<typeof projectRanking>
  hourHeatmap: ReturnType<typeof hourHeatmap>
  modelDaily: ReturnType<typeof modelDaily>
  sessionMeta: ReturnType<typeof sessionMeta>
  costByTokenTypeDaily: ReturnType<typeof costByTokenTypeDaily>
  kpis: ReturnType<typeof kpis>
  activeBlock: ReturnType<typeof activeBlock>
  monthEndProjection: number
  sessionSummaries: ReturnType<typeof sessionSummaries>
  promptStats: ReturnType<typeof promptStats>
}

export function buildAggregates(
  bundle: Bundle,
  todayIso: string,
  tzOffsetMinutes = 0,
): { aggregates: Aggregates; costed: CostedEvent[]; coverage: Coverage } {
  const n = normalizeCcusage(bundle.ccusage)
  const events = toMessageEvents(bundle.sessions)
  const { costed, coverage } = allocateCost(n.session, events)

  const aggregates: Aggregates = {
    dailyCost: dailyCost(n),
    tokenComposition: tokenComposition(n),
    cacheTrend: cacheTrend(n),
    modelTimeline: modelTimeline(n),
    projectRanking: projectRanking(costed),
    hourHeatmap: hourHeatmap(costed, tzOffsetMinutes),
    modelDaily: modelDaily(n),
    sessionMeta: sessionMeta(n),
    costByTokenTypeDaily: costByTokenTypeDaily(costed),
    kpis: kpis(n),
    activeBlock: activeBlock(n),
    monthEndProjection: monthEndProjection(n, todayIso),
    sessionSummaries: sessionSummaries(costed),
    promptStats: promptStats(bundle.sessions),
  }
  return { aggregates, costed, coverage }
}
