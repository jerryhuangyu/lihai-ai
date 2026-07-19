import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Aggregates } from '../aggregate'
import type { Coverage } from '../domain/types'

interface Result {
  aggregates: Aggregates
  coverage: Coverage
  generatedAt: string
}

interface DataState {
  aggregates: Aggregates | null
  coverage: Coverage | null
  generatedAt: string | null
  setResult: (r: Result) => void
  reset: () => void
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      aggregates: null,
      coverage: null,
      generatedAt: null,
      setResult: (r) =>
        set({ aggregates: r.aggregates, coverage: r.coverage, generatedAt: r.generatedAt }),
      reset: () => set({ aggregates: null, coverage: null, generatedAt: null }),
    }),
    {
      name: 'cc-dashboard-aggregates',
      // Bump whenever the persisted Aggregates shape changes. A version mismatch
      // makes zustand discard the stale blob (rehydrate to null → ImportPanel)
      // instead of feeding a shape-incomplete object to selectors/cards.
      // v1: initial. v2: modelEfficiency gained costPerMillionToken + outputShare.
      // v3: added costByTokenType.
      // v4: hourHeatmap cells gained days + lastDate.
      // v5: sessionDistribution now excludes 0-token sessions (values changed,
      //     shape same) — bump to discard stale blobs holding the old totals.
      // v6: added sessionContextPeak (per-session peak per-request context).
      // v7: added promptStats (per-session typed / all user-prompt counts).
      // v8: promptStats gained a per-session date (range-slicing the prompt KPIs).
      // v9: replaced scalar modelEfficiency/costByTokenType/whyToday with
      //     per-date modelDaily + costByTokenTypeDaily arrays, so the cost cards
      //     slice by the date-range filter (whyToday now range-relative too).
      // v10: replaced scalar sessionDistribution/agentShare with per-session
      //      sessionMeta (dated) for range slicing; dropped persisted
      //      sessionContextPeak (now recomputed on-demand from IndexedDB events
      //      filtered by range).
      version: 10,
    },
  ),
)
