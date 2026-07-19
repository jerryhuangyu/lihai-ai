import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import type { PromptStat } from '../../aggregate/prompts'
import { categorical } from '../../viz/palette'
import { fillTemplate } from './fillTemplate'

export interface PromptDistLabels {
  seriesTyped: string
  seriesAll: string
  tooltip: {
    count: string // {{n}} 樣板，如「{{n}} 個 session」
  }
}

function percentile90(sorted: number[]): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil(0.9 * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

// Prompt counts are small integers, so bin by exact value 1..maxBin with a
// >maxBin overflow (not the continuous bucketize used for tokens). maxBin tracks
// P90 of the all-prompt counts, clamped to a readable range.
function intHistogram(values: number[], maxBin: number): number[] {
  const counts = new Array(maxBin + 1).fill(0) // idx 0..maxBin-1 → value 1..maxBin; idx maxBin → overflow
  for (const v of values) {
    if (v > maxBin) counts[maxBin]++
    else if (v >= 1) counts[v - 1]++
  }
  return counts
}

export function buildPromptDistOption(
  stats: PromptStat[],
  theme: ChartTheme,
  labels: PromptDistLabels,
): EChartsOption {
  const all = stats.map((s) => s.all)
  const typed = stats.map((s) => s.typed)
  const maxBin = Math.max(5, Math.min(15, percentile90([...all].sort((a, b) => a - b))))
  const cats = Array.from({ length: maxBin }, (_, i) => String(i + 1)).concat(`>${maxBin}`)
  const c = categorical(theme.theme)
  return {
    grid: { left: 40, right: 16, top: 32, bottom: 28, containLabel: true },
    legend: { data: [labels.seriesTyped, labels.seriesAll], textStyle: { color: theme.muted }, top: 0, right: 0 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => fillTemplate(labels.tooltip.count, { n: String(v) }),
    },
    xAxis: { type: 'category', data: cats, axisLabel: { color: theme.muted, interval: 0 }, axisLine: { lineStyle: { color: theme.grid } }, name: 'prompts', nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      { name: labels.seriesTyped, type: 'bar', data: intHistogram(typed, maxBin), itemStyle: { color: c[2], borderRadius: [4, 4, 0, 0] } },
      { name: labels.seriesAll, type: 'bar', data: intHistogram(all, maxBin), itemStyle: { color: c[0], borderRadius: [4, 4, 0, 0] } },
    ],
  }
}
