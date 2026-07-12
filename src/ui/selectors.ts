import { useDataStore } from '../store/useDataStore'
import type { Aggregates } from '../aggregate'
import type { Coverage } from '../domain/types'

export function useAggregates(): Aggregates | null {
  return useDataStore((s) => s.aggregates)
}
export function useCoverage(): Coverage | null {
  return useDataStore((s) => s.coverage)
}
export function useHasData(): boolean {
  return useDataStore((s) => s.aggregates !== null)
}
