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
      version: 4,
    },
  ),
)
