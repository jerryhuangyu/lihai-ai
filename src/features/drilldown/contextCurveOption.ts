import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import type { ContextPoint } from '../../insights/spans'
import { categorical } from '../../viz/palette'
import { tokensCompact } from '../../ui/format'

export interface ContextCurveLabels {
  xAxisName: string // 例：'訊息序'
}

// Per-turn input-side context for one session. The sawtooth resets mark
// compaction / context clears; a steadily climbing line is a session that kept
// accumulating context without a reset.
export function buildContextCurveOption(
  points: ContextPoint[],
  theme: ChartTheme,
  labels: ContextCurveLabels,
): EChartsOption {
  const color = categorical(theme.theme)[2] // purple
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (v) => tokensCompact(Number(v)) },
    xAxis: { type: 'category', data: points.map((p) => String(p.i)), axisLabel: { color: theme.muted }, axisLine: { lineStyle: { color: theme.grid } }, name: labels.xAxisName, nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted, formatter: (v: number) => tokensCompact(v) } },
    series: [{ type: 'line', showSymbol: false, data: points.map((p) => p.context), lineStyle: { width: 2, color }, areaStyle: { color, opacity: 0.1 } }],
  }
}
