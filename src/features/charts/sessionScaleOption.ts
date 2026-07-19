import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import type { SessionMetric } from '../../insights/sessionMetrics'
import { categorical } from '../../viz/palette'
import { durationCompact } from '../../ui/format'
import { fillTemplate } from './fillTemplate'

export interface SessionScaleLabels {
  xAxisName: string // 時長軸名（分鐘）
  yAxisName: string // 打字 prompt 數軸名
  tooltip: string // {{prompts}} / {{duration}} 樣板
}

// One dot per session: x = wall-clock duration (minutes), y = human-typed prompt
// count (not model requests — those are inflated by SDK/tool loops and confuse
// "session size"). Linear axes keep every session visible: long duration + few
// typed prompts = an autonomous / idle session; many prompts + short = intense
// back-and-forth.
export function buildSessionScaleOption(
  metrics: SessionMetric[],
  theme: ChartTheme,
  labels: SessionScaleLabels,
): EChartsOption {
  const color = categorical(theme.theme)[2] // purple
  const data = metrics.map((m) => [m.durationMs / 60_000, m.typed, m.durationMs])
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 32, containLabel: true },
    tooltip: {
      trigger: 'item',
      formatter: (p: any) =>
        fillTemplate(labels.tooltip, {
          prompts: String(p.data[1]),
          duration: durationCompact(p.data[2]),
        }),
    },
    xAxis: { type: 'value', name: labels.xAxisName, nameLocation: 'middle', nameGap: 22, nameTextStyle: { color: theme.muted }, splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted, formatter: (v: number) => `${v}m` } },
    yAxis: { type: 'value', name: labels.yAxisName, splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      {
        type: 'scatter',
        data,
        symbolSize: 6,
        itemStyle: { color, opacity: 0.5 },
      },
    ],
  }
}
