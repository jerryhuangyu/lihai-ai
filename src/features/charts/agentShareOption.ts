import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { agent: string; cost: number }

export function buildAgentShareOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const colors = categorical(theme.theme)
  return {
    tooltip: { trigger: 'item', valueFormatter: (v) => `$${Number(v).toFixed(2)}` },
    legend: { bottom: 0, textStyle: { color: theme.muted }, icon: 'roundRect' },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        avoidLabelOverlap: true,
        label: { color: theme.muted, formatter: '{b} {d}%' },
        data: rows.map((r, i) => ({ name: r.agent, value: r.cost, itemStyle: { color: colors[i % colors.length] } })),
      },
    ],
  }
}
