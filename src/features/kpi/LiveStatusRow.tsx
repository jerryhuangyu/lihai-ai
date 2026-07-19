import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { usd } from '../../ui/format'
import { Stat } from './Stat'
import { LiveBlock } from './LiveBlock'

// "Right now" state — burn rate, the active 5h billing block, and the
// month-end cost projection. These describe the present (a forward extrapolation
// of current run-rate), not a historical window, so they sit outside the
// date-range filter in their own section. Hidden when nothing live applies.
export function LiveStatusRow() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  if (!agg) return null
  const hasBlock = !!agg.activeBlock
  const hasProjection = agg.monthEndProjection > 0
  if (!hasBlock && !hasProjection) return null
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-muted-foreground text-sm font-medium">{t('overview.sections.liveStatus')}</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {hasBlock && <Stat label={t('kpi.burnRate.label')} value={usd(agg.kpis.burnRatePerHour)} />}
        {hasProjection && (
          <Stat label={t('projection.monthEndStat.label')} value={usd(agg.monthEndProjection)} />
        )}
        {agg.activeBlock && <LiveBlock block={agg.activeBlock} />}
      </div>
    </div>
  )
}
