import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'
import { fillTemplate } from './fillTemplate'
import { bucketize } from './sessionDistOption'

const NORMAL_BINS = 14

function percentile90(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil(0.9 * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

export interface AgenticDepthLabels {
  tooltip: {
    count: string // {{n}} 樣板，如「{{n}} 個 session」
  }
}

// Histogram of model-requests-per-typed-prompt across sessions. High = each
// human prompt triggers a lot of autonomous work (deep tool loops). Same
// long-tail treatment as sessionDist: [0,P90] bins + a >P90 overflow.
export function buildAgenticDepthOption(
  ratios: number[],
  theme: ChartTheme,
  labels: AgenticDepthLabels,
): EChartsOption {
  const color = categorical(theme.theme)[2] // purple
  const cap = percentile90([...ratios].sort((a, b) => a - b))
  const buckets = bucketize(ratios, NORMAL_BINS, cap)
  const label = (b: { lo: number; overflow?: boolean }) =>
    b.overflow ? `>${Math.round(b.lo)}×` : `${Math.round(b.lo)}×`
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 28, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => fillTemplate(labels.tooltip.count, { n: String(v) }),
    },
    xAxis: { type: 'category', data: buckets.map(label), axisLabel: { color: theme.muted, interval: 1 }, axisLine: { lineStyle: { color: theme.grid } }, name: 'turns/prompt', nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      {
        type: 'bar',
        data: buckets.map((b) => b.count),
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      },
    ],
  }
}
