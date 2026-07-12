import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { buildCacheTrendOption } from './cacheTrendOption'

export function CacheTrendCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null
  const data = sliceByDate(agg.cacheTrend, range)
  return (
    <Card title="Cache 命中率趨勢">
      {data.length === 0 ? <EmptyState>尚無資料</EmptyState> : <EChart option={buildCacheTrendOption(data, theme)} />}
    </Card>
  )
}
