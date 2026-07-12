import { create } from 'zustand'
import type { RangePreset } from './range'

interface FilterState {
  preset: RangePreset
  setPreset: (p: RangePreset) => void
}
export const useFilterStore = create<FilterState>((set) => ({
  preset: 'all',
  setPreset: (preset) => set({ preset }),
}))
