import { useEffect, useState } from 'react'
import { useResolvedRange } from './FilterBar'
import { useDataStore } from '../../store/useDataStore'
import { allEvents } from '../../store/rawDb'
import { recomputeEventCards } from './recompute'
import type { Aggregates } from '../../aggregate'

export function useFilteredEventCards(): {
  projectRanking: Aggregates['projectRanking']
  hourHeatmap: Aggregates['hourHeatmap']
  loading: boolean
} {
  const { preset, from, to } = useResolvedRange()
  const agg = useDataStore((s) => s.aggregates)
  // Seed from the precomputed aggregates so a preset switch never flashes empty.
  const [asyncState, setAsyncState] = useState<{
    projectRanking: Aggregates['projectRanking']
    hourHeatmap: Aggregates['hourHeatmap']
    loading: boolean
  }>(() => ({
    projectRanking: agg?.projectRanking ?? [],
    hourHeatmap: agg?.hourHeatmap ?? [],
    loading: false,
  }))

  useEffect(() => {
    let cancelled = false
    if (!agg || preset === 'all') return
    setAsyncState((s) => ({ ...s, loading: true }))
    allEvents().then((events) => {
      if (cancelled) return
      const r = recomputeEventCards(events, { from, to }, new Date().getTimezoneOffset())
      setAsyncState({ ...r, loading: false })
    })
    return () => {
      cancelled = true
    }
  }, [agg, preset, from, to])

  // 'all' reads straight from the already-computed aggregates during render, so the first
  // paint has real data instead of flashing the [] fallback while an effect catches up.
  if (preset === 'all') {
    return {
      projectRanking: agg?.projectRanking ?? [],
      hourHeatmap: agg?.hourHeatmap ?? [],
      loading: false,
    }
  }

  return asyncState
}
