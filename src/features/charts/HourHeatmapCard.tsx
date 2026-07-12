import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { EChart } from '../../viz/EChart'
import { useChartTheme } from '../../viz/theme'
import { useFilteredEventCards } from '../filter/useFilteredEventCards'
import { buildHourHeatmapOption } from './hourHeatmapOption'

export function HourHeatmapCard() {
  const { hourHeatmap, loading } = useFilteredEventCards()
  const theme = useChartTheme()
  return (
    <Card title="開發時段熱力圖" subtitle="本地時間" className="lg:col-span-2">
      {loading ? (
        <EmptyState>載入中…</EmptyState>
      ) : hourHeatmap.length === 0 ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildHourHeatmapOption(hourHeatmap, theme)} style={{ height: 300 }} />
      )}
    </Card>
  )
}
