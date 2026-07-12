import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'
import { fillTemplate } from './fillTemplate'

export function bucketize(totals: number[], bins: number): { label: string; count: number; lo: number }[] {
  if (totals.length === 0) return []
  const max = Math.max(...totals)
  const width = max / bins || 1
  const out = Array.from({ length: bins }, (_, i) => ({ label: '', count: 0, lo: i * width }))
  for (const t of totals) {
    const idx = Math.min(bins - 1, Math.floor(t / width))
    out[idx].count++
  }
  const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(Math.round(n)))
  for (let i = 0; i < out.length; i++) out[i].label = k(out[i].lo)
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
  const color = categorical(theme.theme)[2] // purple
  const buckets = bucketize(d.totals, 12)
  const max = d.totals.length ? Math.max(...d.totals) : 1
  const width = max / 12 || 1
  const p90Bin = Math.min(11, Math.floor(d.p90 / width))
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
          label: { color: theme.muted, formatter: `P90` },
          data: [{ xAxis: p90Bin }],
        },
      },
    ],
  }
}
