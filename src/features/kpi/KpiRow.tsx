import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { usd, deltaLabel } from '../../ui/format'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceKpis } from '../filter/slice'
import { LiveBlock } from './LiveBlock'

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const d = delta === undefined ? null : deltaLabel(delta)
  const color = d?.dir === 'up' ? 'text-emerald-600' : d?.dir === 'down' ? 'text-rose-600' : 'text-muted-foreground'
  return (
    <Card>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {d && <p className={`mt-1 text-xs ${color}`}>{d.text} vs 前一日</p>}
    </Card>
  )
}

export function KpiRow() {
  const agg = useAggregates()
  const range = useResolvedRange()
  if (!agg) return null
  const { kpis, activeBlock } = agg
  const sliced = sliceKpis(agg.dailyCost, range)
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label="總花費" value={usd(sliced.totalCost)} delta={sliced.deltaPct} />
      <Stat label="日均花費" value={usd(sliced.avgPerDay)} />
      <Stat label="Burn rate（每小時）" value={usd(kpis.burnRatePerHour)} />
      {activeBlock && <LiveBlock block={activeBlock} />}
    </div>
  )
}
