import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { project: string; cost: number; tokens: number }

export function buildProjectRankingOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const top = rows.slice(0, 10)
  const color = categorical(theme.theme)[0]
  // echarts category axis draws bottom→top; reverse so the biggest is on top
  const ordered = [...top].reverse()
  return {
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', valueFormatter: (v) => `$${Number(v).toFixed(2)}` },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    yAxis: {
      type: 'category',
      data: ordered.map((r) => r.project),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    series: [
      {
        type: 'bar',
        data: ordered.map((r) => r.cost),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: theme.muted, formatter: (p: any) => `$${p.value.toFixed(0)}` },
      },
    ],
  }
}
