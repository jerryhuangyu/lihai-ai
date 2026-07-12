import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'
import type { CostByTokenType } from '../../aggregate/analytics'

export interface CostByTokenTypeLabels {
  // yAxis category order (echarts draws category bottom→top): usage bottom, cost top.
  rows: { usage: string; cost: string }
  // 'Input'/'Output' 為技術詞彙，兩語系共用不需翻譯；僅 Cache 系列有中文需參數化。
  series: { cacheCreation: string; cacheRead: string }
}

// Fixed semantic order + palette indices (blue, orange, purple, cyan), identical
// to TokenCompositionCard's stack so the same token type reads the same color
// across cards. Resolved via categorical(theme) so dark mode uses dark-surface hues.
function buildSeriesMeta(
  labels: CostByTokenTypeLabels,
): { name: string; key: keyof CostByTokenType; idx: number }[] {
  return [
    { name: 'Input', key: 'input', idx: 0 },
    { name: 'Output', key: 'output', idx: 1 },
    { name: labels.series.cacheCreation, key: 'cacheCreation', idx: 2 },
    { name: labels.series.cacheRead, key: 'cacheRead', idx: 5 },
  ]
}

function formatTokens(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`
  return `${Math.round(n)}`
}

function pct(value: number, total: number): number {
  return total === 0 ? 0 : (value / total) * 100
}

export function buildCostByTokenTypeOption(
  data: CostByTokenType,
  theme: ChartTheme,
  labels: CostByTokenTypeLabels,
): EChartsOption {
  const colors = categorical(theme.theme)
  const SERIES = buildSeriesMeta(labels)
  const ROWS = [labels.rows.usage, labels.rows.cost]
  const costTotal = SERIES.reduce((a, s) => a + (data[s.key]?.cost ?? 0), 0)
  const tokenTotal = SERIES.reduce((a, s) => a + (data[s.key]?.tokens ?? 0), 0)

  const formatter = (params: unknown) => {
    const list = Array.isArray(params) ? params : params ? [params] : []
    if (list.length === 0) return ''
    const dataIndex = (list[0] as { dataIndex?: number })?.dataIndex ?? 0
    const rowName = ROWS[dataIndex] ?? ''
    const isCostRow = dataIndex === 1
    const lines = SERIES.map((s) => {
      const split = data[s.key]
      if (!split) return `${s.name} -`
      if (isCostRow) {
        return `${s.name} $${split.cost.toFixed(2)} (${pct(split.cost, costTotal).toFixed(0)}%)`
      }
      return `${s.name} ${formatTokens(split.tokens)} (${pct(split.tokens, tokenTotal).toFixed(0)}%)`
    })
    return [rowName, ...lines].join('<br/>')
  }

  return {
    grid: { left: 56, right: 16, top: 32, bottom: 28 },
    legend: { top: 0, textStyle: { color: theme.muted }, icon: 'roundRect' },
    tooltip: { trigger: 'axis', formatter },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `${v}%` },
    },
    yAxis: {
      type: 'category',
      data: [...ROWS],
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    series: SERIES.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: 'pct',
      // 2px surface-colored border between fills = the visible separator between stacked segments
      itemStyle: { color: colors[s.idx], borderColor: theme.surface, borderWidth: 2 },
      data: [pct(data[s.key]?.tokens ?? 0, tokenTotal), pct(data[s.key]?.cost ?? 0, costTotal)],
    })),
  }
}
