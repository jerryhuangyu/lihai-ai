import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'
import { fillTemplate } from './fillTemplate'
import { bucketize } from './sessionDistOption'

// Fixed absolute axis: peak per-request context is bounded by the model's
// context window, so [0, 1M] with round 100K bins lets the 200K / 1M reference
// lines land on real token positions. A >1M overflow bin catches anything that
// somehow exceeded even the largest window.
const CONTEXT_WINDOW_MAX = 1_000_000 // 1M-token window = axis cap
const WINDOW_200K = 200_000
const NORMAL_BINS = 10 // 100K per bin → 200K / 1M fall on bin edges

export interface SessionContextLabels {
  tooltip: {
    sessionCount: string // {{n}} 樣板字串，如「{{n}} 個 session」
  }
  window200k: string // 200K 視窗參考線標籤
  window1m: string // 1M 視窗參考線標籤
}

export function buildSessionContextOption(
  d: { peaks: number[] },
  theme: ChartTheme,
  labels: SessionContextLabels,
): EChartsOption {
  const color = categorical(theme.theme)[2] // purple
  const buckets = bucketize(d.peaks, NORMAL_BINS, CONTEXT_WINDOW_MAX)
  const width = CONTEXT_WINDOW_MAX / NORMAL_BINS || 1
  // Which category index a token value maps to; cap and above → overflow bin.
  const binOf = (v: number) =>
    v >= CONTEXT_WINDOW_MAX ? NORMAL_BINS : Math.min(NORMAL_BINS - 1, Math.floor(v / width))
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 28, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => fillTemplate(labels.tooltip.sessionCount, { n: String(v) }),
    },
    xAxis: { type: 'category', data: buckets.map((b) => b.label), axisLabel: { color: theme.muted, interval: 1 }, axisLine: { lineStyle: { color: theme.grid } }, name: 'tokens', nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      {
        type: 'bar',
        data: buckets.map((b) => b.count),
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        markLine: {
          symbol: 'none',
          lineStyle: { color: theme.muted, type: 'dashed' },
          label: { color: theme.muted },
          data: [
            { xAxis: binOf(WINDOW_200K), label: { formatter: labels.window200k } },
            { xAxis: binOf(CONTEXT_WINDOW_MAX), label: { formatter: labels.window1m } },
          ],
        },
      },
    ],
  }
}
