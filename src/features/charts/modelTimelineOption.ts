import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { date: string; model: string; cost: number }
const MAX_NAMED = 5 // 6th hue reserved for 其他

export function buildModelTimelineOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const colors = categorical(theme.theme)
  const dates = [...new Set(rows.map((r) => r.date))].sort()
  const totalByModel = new Map<string, number>()
  for (const r of rows) totalByModel.set(r.model, (totalByModel.get(r.model) ?? 0) + r.cost)
  const ranked = [...totalByModel.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m)
  const named = ranked.slice(0, MAX_NAMED)
  const foldRest = ranked.length > MAX_NAMED

  const label = (m: string) => (named.includes(m) ? m : '其他')
  const seriesNames = foldRest ? [...named, '其他'] : named

  const cell = new Map<string, Map<string, number>>() // name -> date -> cost
  for (const name of seriesNames) cell.set(name, new Map())
  for (const r of rows) {
    const c = cell.get(label(r.model))!
    c.set(r.date, (c.get(r.date) ?? 0) + r.cost)
  }

  return {
    grid: { left: 56, right: 16, top: 32, bottom: 28 },
    ...(seriesNames.length >= 2 ? { legend: { top: 0, textStyle: { color: theme.muted }, icon: 'roundRect' } } : {}),
    tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? '—' : `$${Number(v).toFixed(2)}`) },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    series: seriesNames.map((name, i) => ({
      name,
      type: 'line',
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2, color: colors[i] },
      itemStyle: { color: colors[i] },
      data: dates.map((d) => cell.get(name)!.get(d) ?? null),
    })),
  }
}
