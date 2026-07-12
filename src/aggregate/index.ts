import type { Bundle, CostedEvent, Coverage } from '../domain/types'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { dailyCost, tokenComposition, cacheTrend, modelTimeline } from './timeseries'
import {
  projectRanking, hourHeatmap, agentShare, modelEfficiency, sessionDistribution,
  costByTokenType,
} from './analytics'
import { kpis, activeBlock, monthEndProjection, whyToday } from './kpi'
import { sessionSummaries } from './sessions'

export interface Aggregates {
  dailyCost: ReturnType<typeof dailyCost>
  tokenComposition: ReturnType<typeof tokenComposition>
  cacheTrend: ReturnType<typeof cacheTrend>
  modelTimeline: ReturnType<typeof modelTimeline>
  projectRanking: ReturnType<typeof projectRanking>
  hourHeatmap: ReturnType<typeof hourHeatmap>
  agentShare: ReturnType<typeof agentShare>
  modelEfficiency: ReturnType<typeof modelEfficiency>
  sessionDistribution: ReturnType<typeof sessionDistribution>
  costByTokenType: ReturnType<typeof costByTokenType>
  kpis: ReturnType<typeof kpis>
  activeBlock: ReturnType<typeof activeBlock>
  monthEndProjection: number
  whyToday: ReturnType<typeof whyToday>
  sessionSummaries: ReturnType<typeof sessionSummaries>
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
    agentShare: agentShare(n),
    modelEfficiency: modelEfficiency(n),
    sessionDistribution: sessionDistribution(n),
    costByTokenType: costByTokenType(costed),
    kpis: kpis(n),
    activeBlock: activeBlock(n),
    monthEndProjection: monthEndProjection(n, todayIso),
    whyToday: whyToday(n, todayIso),
    sessionSummaries: sessionSummaries(costed),
  }
  return { aggregates, costed, coverage }
}
