import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'
import { durationCompact } from '../../ui/format'
import { fillTemplate } from './fillTemplate'
import { bucketize } from './sessionDistOption'

const NORMAL_BINS = 14

function percentile90(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil(0.9 * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

export interface CadenceLabels {
  tooltip: {
    count: string // {{n}} 樣板，如「{{n}} 次」
  }
}

// Histogram of inter-turn gaps. Same long-tail treatment as sessionDist:
// [0, P90] equal bins + a >P90 overflow bin isolates the long idle gaps
// (walked away, resumed later) so the everyday cadence spreads out. x-axis
// labelled in time units, not raw ms.
export function buildCadenceOption(
  gaps: number[],
  theme: ChartTheme,
  labels: CadenceLabels,
): EChartsOption {
  const color = categorical(theme.theme)[2] // purple
  const sorted = [...gaps].sort((a, b) => a - b)
  const cap = percentile90(sorted)
  const buckets = bucketize(gaps, NORMAL_BINS, cap)
  const label = (b: { lo: number; overflow?: boolean }) =>
    b.overflow ? `>${durationCompact(b.lo)}` : durationCompact(b.lo)
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 28, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => fillTemplate(labels.tooltip.count, { n: String(v) }),
    },
    xAxis: { type: 'category', data: buckets.map(label), axisLabel: { color: theme.muted, interval: 1 }, axisLine: { lineStyle: { color: theme.grid } }, name: 'gap', nameTextStyle: { color: theme.muted } },
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
