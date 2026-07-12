import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { buildSessionDistOption } from './sessionDistOption'

export function SessionDistCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="Session 上下文分布" subtitle="每個 session 的總 token 量">
      {agg.sessionDistribution.totals.length === 0 ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildSessionDistOption(agg.sessionDistribution, theme)} style={{ height: 300 }} />
      )}
    </Card>
  )
}
