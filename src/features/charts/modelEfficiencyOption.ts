import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

export interface EfficiencyRow {
  model: string
  listRate: number // output list price $/1M (rows passed in are priced + sorted asc by listRate)
  perTokenCost: number // your blended $/1M TOTAL token
  outputShare: number // output tokens / total tokens (0..1)
  exact: boolean // false = family estimate
}

export function buildModelEfficiencyOption(rows: EfficiencyRow[], theme: ChartTheme): EChartsOption {
  const color = categorical(theme.theme)[3] // green = efficiency identity
  const ordered = [...rows].reverse() // cheapest list price on top
  return {
    grid: { left: 8, right: 96, top: 8, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'item',
      // anchor the tooltip's bottom-center at the cursor (floats just above it)
      position: (
        point: [number, number],
        _p: unknown,
        _dom: unknown,
        _rect: unknown,
        size: { contentSize: [number, number] },
      ) => [point[0] - size.contentSize[0] / 2, point[1] - size.contentSize[1] - 12],
      formatter: (p: any) => {
        const r = ordered[p.dataIndex]
        const sub = (s: string) =>
          `<div style="color:${theme.muted};font-size:12px;line-height:1.7">${s}</div>`
        return (
          `<div style="color:${theme.ink};font-weight:600;font-size:13px;margin-bottom:3px">${r.model}</div>` +
          sub(`官方 output 牌價 $${r.listRate}/1M${r.exact ? '' : '（估計）'}`) +
          sub(`實付均價 $${(r.perTokenCost ?? 0).toFixed(2)}/1M token（含全部 token）`) +
          sub(`output token 佔用量 ${((r.outputShare ?? 0) * 100).toFixed(1)}%`)
        )
      },
    },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    yAxis: {
      type: 'category',
      data: ordered.map((r) => r.model),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    series: [
      {
        type: 'bar',
        data: ordered.map((r) => r.listRate),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: {
          show: true,
          position: 'right',
          color: theme.muted,
          formatter: (p: any) => `$${ordered[p.dataIndex].listRate}/1M`,
        },
      },
    ],
  }
}
