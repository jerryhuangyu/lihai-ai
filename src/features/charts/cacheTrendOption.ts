import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { date: string; hitRate: number; cacheReadTokens: number }

export function buildCacheTrendOption(data: Row[], theme: ChartTheme): EChartsOption {
  const color = categorical(theme.theme)[5] // cyan = cache identity
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `${(Number(v) * 100).toFixed(1)}%`,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `${Math.round(v * 100)}%` },
    },
    series: [
      {
        name: 'Cache 命中率',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data.map((d) => d.hitRate),
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.1 },
      },
    ],
  }
}
