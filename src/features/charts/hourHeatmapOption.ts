import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { sequentialBlue } from '../../viz/palette'

type Cell = { weekday: number; hour: number; cost: number; days?: number; lastDate?: string }
const DOW = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const HOURS = Array.from({ length: 24 }, (_, h) => String(h))

export function buildHourHeatmapOption(cells: Cell[], theme: ChartTheme): EChartsOption {
  const max = cells.reduce((m, c) => Math.max(m, c.cost), 0)
  const total = cells.reduce((s, c) => s + c.cost, 0)
  return {
    grid: { left: 48, right: 16, top: 8, bottom: 56, containLabel: true },
    tooltip: {
      position: 'top',
      formatter: (p: any) => {
        // data dims: [hour, weekday, cost, days, lastDate]
        const [hour, weekday, cost, days, lastDate] = p.value
        const share = total > 0 ? ((cost ?? 0) / total) * 100 : 0
        const sub = (s: string) =>
          `<div style="color:${theme.muted};font-size:12px;line-height:1.7">${s}</div>`
        return (
          `<div style="color:${theme.ink};font-weight:600;font-size:13px;margin-bottom:3px">${DOW[weekday]} ${hour}:00</div>` +
          sub(`$${Number(cost ?? 0).toFixed(2)} · 佔總花費 ${share.toFixed(1)}%`) +
          sub(`共 ${days ?? 0} 天有活動${lastDate ? ` · 最近 ${lastDate}` : ''}`)
        )
      },
    },
    xAxis: { type: 'category', data: HOURS, splitArea: { show: false }, axisLabel: { color: theme.muted, interval: 2 }, axisLine: { lineStyle: { color: theme.grid } } },
    yAxis: { type: 'category', data: DOW, splitArea: { show: false }, axisLabel: { color: theme.muted }, axisLine: { lineStyle: { color: theme.grid } } },
    visualMap: {
      min: 0,
      max: max || 1,
      dimension: 2, // color by cost, not the extra days/lastDate dims
      // Draggable range filter: drag the handles to keep a cost band; cells
      // outside dim to 15% so filtering works consistently across the WHOLE
      // range (selecting an empty high band greys everything — itself a signal
      // that no slot is that expensive), unlike hover-highlight which no-ops on
      // sparse bands.
      calculable: true,
      outOfRange: { opacity: 0.15 },
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: theme.muted },
      inRange: { color: sequentialBlue(theme.theme) },
    },
    series: [
      {
        type: 'heatmap',
        data: cells.map((c) => [c.hour, c.weekday, c.cost, c.days ?? 0, c.lastDate ?? '']),
        itemStyle: { borderColor: theme.surface, borderWidth: 1 },
        // Strong hover feedback: ink ring + shadow on the hovered cell (the
        // default heatmap emphasis is barely visible on the blue ramp). No
        // focus:'self' — the range filter above owns dimming; a single-cell
        // hover should not grey the whole grid.
        emphasis: {
          itemStyle: { borderColor: theme.ink, borderWidth: 2, shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.35)' },
        },
      },
    ],
  }
}
