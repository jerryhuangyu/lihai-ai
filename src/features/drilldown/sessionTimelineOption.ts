import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import type { CostedEvent } from '../../domain/types'
import { categorical } from '../../viz/palette'

export interface SessionTimelineLabels {
  xAxisName: string // 例：'訊息序'
}

export function buildSessionTimelineOption(
  events: CostedEvent[],
  theme: ChartTheme,
  labels: SessionTimelineLabels,
): EChartsOption {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts))
  let acc = 0
  const cum = sorted.map((e) => (acc += e.cost))
  const color = categorical(theme.theme)[0]
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (v) => `$${Number(v).toFixed(2)}` },
    xAxis: { type: 'category', data: sorted.map((_, i) => String(i + 1)), axisLabel: { color: theme.muted }, axisLine: { lineStyle: { color: theme.grid } }, name: labels.xAxisName, nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` } },
    series: [{ type: 'line', step: 'end', showSymbol: false, data: cum, lineStyle: { width: 2, color }, areaStyle: { color, opacity: 0.1 } }],
  }
}
