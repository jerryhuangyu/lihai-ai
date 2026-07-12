import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

export function buildDailyCostOption(
  data: { date: string; cost: number }[],
  theme: ChartTheme,
): EChartsOption {
  const color = categorical(theme.theme)[0] // blue, fixed identity
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `$${Number(v).toFixed(2)}`,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    series: [
      {
        name: '每日成本',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data.map((d) => d.cost),
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.12 },
      },
    ],
  }
}
