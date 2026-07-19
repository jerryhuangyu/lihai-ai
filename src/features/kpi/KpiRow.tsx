import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { usd } from '../../ui/format'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceKpis, sliceByDate } from '../filter/slice'
import { Stat } from './Stat'

// Range-scoped headline numbers: every stat here responds to the 7d/30d/90d/all
// filter. Live "right now" metrics (burn rate, active block) live in
// LiveStatusRow instead, so the filter dependency is unambiguous.
export function KpiRow() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const range = useResolvedRange()
  if (!agg) return null
  const sliced = sliceKpis(agg.dailyCost, range)
  const promptRows = sliceByDate(agg.promptStats, range)
  const totalTyped = promptRows.reduce((a, p) => a + p.typed, 0)
  const avgTyped = promptRows.length ? totalTyped / promptRows.length : 0
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label={t('kpi.totalCost.label')} value={usd(sliced.totalCost)} delta={sliced.deltaPct} />
      <Stat label={t('kpi.avgPerDay.label')} value={usd(sliced.avgPerDay)} />
      <Stat label={t('kpi.totalTypedPrompts.label')} value={totalTyped.toLocaleString('en-US')} />
      <Stat label={t('kpi.avgTypedPrompts.label')} value={avgTyped.toFixed(1)} />
    </div>
  )
}
