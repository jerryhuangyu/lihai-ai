import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

export function applyTheme(mode: ThemeMode) {
  const el = document.documentElement
  el.classList.remove('dark', 'light')
  if (mode === 'dark') el.classList.add('dark')
  else if (mode === 'light') el.classList.add('light')
  // system: 兩者皆不加，回落 prefers-color-scheme
}

interface ThemeState {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  cycle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => {
        applyTheme(mode)
        set({ mode })
      },
      cycle: () => {
        const order: ThemeMode[] = ['system', 'light', 'dark']
        const next = order[(order.indexOf(get().mode) + 1) % order.length]
        applyTheme(next)
        set({ mode: next })
      },
    }),
    {
      name: 'cc-dashboard-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.mode)
      },
    },
  ),
)
