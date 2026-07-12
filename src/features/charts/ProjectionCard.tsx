import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function ProjectionCard() {
  const agg = useAggregates()
  if (!agg) return null
  const blockProj = agg.activeBlock?.projection?.totalCost
  return (
    <Card title="成本預測">
      <p className="text-muted-foreground text-xs">本月線性推估至月底</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{usd(agg.monthEndProjection)}</p>
      {blockProj !== undefined && (
        <p className="text-muted-foreground mt-2 text-xs">目前 5h 區塊預估 {usd(blockProj)}</p>
      )}
    </Card>
  )
}
