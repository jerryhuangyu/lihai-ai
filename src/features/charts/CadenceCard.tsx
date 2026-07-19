import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useRawEvents } from '../../insights/useRawEvents'
import { eventsInRange } from '../../insights/rangeFilter'
import { turnGaps } from '../../insights/spans'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { buildCadenceOption } from './cadenceOption'

export function CadenceCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const { events, loading } = useRawEvents()
  const theme = useChartTheme()
  const { from, to } = useResolvedRange()
  const gaps = useMemo(() => turnGaps(eventsInRange(events, { from, to })), [events, from, to])
  if (!agg) return null
  return (
    <Card title={t('cadence.title')} subtitle={t('cadence.subtitle')}>
      {loading ? (
        <EmptyState>{t('common.loading')}</EmptyState>
      ) : gaps.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildCadenceOption(gaps, theme, {
            tooltip: { count: t('cadence.tooltip.count') },
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
