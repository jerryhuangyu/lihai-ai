import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { buildModelTimelineOption } from './modelTimelineOption'

export function ModelTimelineCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null
  const data = sliceByDate(agg.modelTimeline, range)
  return (
    <Card title="Model 使用時間軸">
      {data.length === 0 ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildModelTimelineOption(data, theme)} />
      )}
    </Card>
  )
}
