import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { buildDailyCostOption } from './dailyCostOption'

export function DailyCostCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null
  const data = sliceByDate(agg.dailyCost, range)
  return (
    <Card title="每日成本">
      {data.length === 0 ? <EmptyState>尚無資料</EmptyState> : <EChart option={buildDailyCostOption(data, theme)} />}
    </Card>
  )
}
