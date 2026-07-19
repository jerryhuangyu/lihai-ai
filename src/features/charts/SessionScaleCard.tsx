import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useRawEvents } from '../../insights/useRawEvents'
import { eventsInRange } from '../../insights/rangeFilter'
import { sessionSpans } from '../../insights/spans'
import { joinSessionMetrics } from '../../insights/sessionMetrics'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { buildSessionScaleOption } from './sessionScaleOption'

export function SessionScaleCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const { events, loading } = useRawEvents()
  const theme = useChartTheme()
  const { from, to } = useResolvedRange()
  const metrics = useMemo(
    () => joinSessionMetrics(sessionSpans(eventsInRange(events, { from, to })), agg?.promptStats ?? []),
    [events, from, to, agg],
  )
  if (!agg) return null
  return (
    <Card title={t('sessionScale.title')} subtitle={t('sessionScale.subtitle')}>
      {loading ? (
        <EmptyState>{t('common.loading')}</EmptyState>
      ) : metrics.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildSessionScaleOption(metrics, theme, {
            xAxisName: t('sessionScale.xAxisName'),
            yAxisName: t('sessionScale.yAxisName'),
            tooltip: t('sessionScale.tooltip'),
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
