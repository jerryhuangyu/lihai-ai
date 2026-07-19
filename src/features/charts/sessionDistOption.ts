import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'
import { fillTemplate } from './fillTemplate'

export interface Bucket {
  label: string
  count: number
  lo: number
  overflow?: boolean
}

// Long-tail-safe histogram: split [0, cap] into `normalBins` equal-width bins,
// plus ONE overflow bin for sessions with tokens > cap. cap is meant to be a
// high percentile (P95) so a handful of extreme outliers don't stretch the axis
// and collapse every normal session into bin 0. Returns normalBins + 1 buckets.
export function bucketize(totals: number[], normalBins: number, cap: number): Bucket[] {
  if (totals.length === 0) return []
  const width = cap / normalBins || 1
  const out: Bucket[] = Array.from({ length: normalBins }, (_, i) => ({ label: '', count: 0, lo: i * width }))
  const overflow: Bucket = { label: '', count: 0, lo: cap, overflow: true }
  for (const t of totals) {
    if (t >= cap) overflow.count++
    else out[Math.min(normalBins - 1, Math.floor(t / width))].count++
  }
  const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(Math.round(n)))
  for (const b of out) b.label = k(b.lo)
  overflow.label = `>${k(cap)}`
  out.push(overflow)
  return out
}

export interface SessionDistLabels {
  tooltip: {
    sessionCount: string // {{n}} 樣板字串，如「{{n}} 個 session」
  }
}

export function buildSessionDistOption(
  d: { totals: number[]; p50: number; p90: number },
  theme: ChartTheme,
  labels: SessionDistLabels,
): EChartsOption {
  const NORMAL_BINS = 14
  const color = categorical(theme.theme)[2] // purple
  const cap = d.p90
  const buckets = bucketize(d.totals, NORMAL_BINS, cap)
  const width = cap / NORMAL_BINS || 1
  // cap = P90, so the markLine sits at the last normal bin — the P90 / overflow
  // boundary. clamp keeps it out of the overflow bin at index NORMAL_BINS.
  const p90Bin = Math.min(NORMAL_BINS - 1, Math.floor(d.p90 / width))
  // With more bins the x-axis would crowd, so print ~6 evenly-spaced normal
  // labels and always keep the trailing overflow (>P90) label visible.
  const labelStep = Math.max(1, Math.ceil(NORMAL_BINS / 6))
  const showLabel = (i: number) => i === buckets.length - 1 || i % labelStep === 0
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 28, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => fillTemplate(labels.tooltip.sessionCount, { n: String(v) }),
    },
    xAxis: { type: 'category', data: buckets.map((b) => b.label), axisLabel: { color: theme.muted, interval: showLabel }, axisLine: { lineStyle: { color: theme.grid } }, name: 'tokens', nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      {
        type: 'bar',
        data: buckets.map((b) => b.count),
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        markLine: {
          symbol: 'none',
          lineStyle: { color: theme.muted, type: 'dashed' },
          label: { color: theme.muted, formatter: `P90` },
          data: [{ xAxis: p90Bin }],
        },
      },
    ],
  }
}
