import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { date: string; input: number; output: number; cacheCreation: number; cacheRead: number }

// Fixed semantic order + palette indices (blue, orange, purple, cyan).
const SERIES: { name: string; key: keyof Omit<Row, 'date'>; idx: number }[] = [
  { name: 'Input', key: 'input', idx: 0 },
  { name: 'Output', key: 'output', idx: 1 },
  { name: 'Cache 建立', key: 'cacheCreation', idx: 2 },
  { name: 'Cache 讀取', key: 'cacheRead', idx: 5 },
]

export function buildTokenCompositionOption(
  data: Row[],
  theme: ChartTheme,
  normalized = false,
): EChartsOption {
  const colors = categorical(theme.theme)
  // Per-date totals, used to rescale each date's 4 values to sum 100% in normalized mode.
  const totals = data.map((d) => d.input + d.output + d.cacheCreation + d.cacheRead)
  const valueAt = (s: (typeof SERIES)[number], i: number) => {
    const raw = data[i][s.key]
    if (!normalized) return raw
    const total = totals[i]
    return total === 0 ? 0 : (raw / total) * 100
  }
  return {
    grid: { left: 56, right: 16, top: 32, bottom: 28 },
    legend: { top: 0, textStyle: { color: theme.muted }, icon: 'roundRect' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      ...(normalized ? { max: 100 } : {}),
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: {
        color: theme.muted,
        ...(normalized ? { formatter: (v: number) => `${v}%` } : {}),
      },
    },
    series: SERIES.map((s) => ({
      name: s.name,
      type: 'line',
      stack: 'tok',
      smooth: false,
      showSymbol: false,
      areaStyle: { color: colors[s.idx], opacity: 0.85 },
      // 2px surface-colored top edge = the visible separator between stacked bands
      lineStyle: { width: 2, color: theme.surface },
      itemStyle: { color: colors[s.idx] },
      data: data.map((_, i) => valueAt(s, i)),
    })),
  }
}
