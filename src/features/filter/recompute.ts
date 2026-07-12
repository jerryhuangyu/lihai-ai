import type { CostedEvent } from '../../domain/types'
import { projectRanking, hourHeatmap } from '../../aggregate/analytics'

export function recomputeEventCards(
  events: CostedEvent[],
  range: { from: string; to: string },
  tzOffsetMinutes: number,
) {
  const filtered = events.filter((e) => {
    const d = e.ts.slice(0, 10)
    return d >= range.from && d <= range.to
  })
  return {
    projectRanking: projectRanking(filtered),
    hourHeatmap: hourHeatmap(filtered, tzOffsetMinutes),
  }
}
