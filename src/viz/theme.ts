import { useEffect, useState } from 'react'

export interface ChartTheme {
  theme: 'light' | 'dark'
  ink: string
  muted: string
  grid: string
  surface: string
}

function readTheme(): ChartTheme {
  const root = document.documentElement
  const hasDarkClass = root.classList.contains('dark')
  const hasLightClass = root.classList.contains('light')
  const attr = root.getAttribute('data-theme')
  const dark =
    hasDarkClass ||
    attr === 'dark' ||
    (!hasLightClass && attr !== 'light' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  const css = getComputedStyle(root)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    theme: dark ? 'dark' : 'light',
    ink: v('--foreground', dark ? '#e5e5e5' : '#171717'),
    muted: v('--muted-foreground', dark ? '#a3a3a3' : '#6b7280'),
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    surface: v('--card', dark ? '#1a1a1a' : '#ffffff'),
  }
}

export function useChartTheme(): ChartTheme {
  const [t, setT] = useState<ChartTheme>(readTheme)
  useEffect(() => {
    const update = () => setT(readTheme())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] })
    return () => {
      mq.removeEventListener('change', update)
      obs.disconnect()
    }
  }, [])
  return t
}
