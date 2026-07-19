import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useRawEvents } from '../../insights/useRawEvents'
import { eventsInRange } from '../../insights/rangeFilter'
import { sessionSpans } from '../../insights/spans'
import { joinSessionMetrics, turnsPerPrompt } from '../../insights/sessionMetrics'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { buildAgenticDepthOption } from './agenticDepthOption'

export function AgenticDepthCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const { events, loading } = useRawEvents()
  const theme = useChartTheme()
  const { from, to } = useResolvedRange()
  const ratios = useMemo(
    () =>
      turnsPerPrompt(
        joinSessionMetrics(sessionSpans(eventsInRange(events, { from, to })), agg?.promptStats ?? []),
      ),
    [events, from, to, agg],
  )
  if (!agg) return null
  return (
    <Card title={t('agenticDepth.title')} subtitle={t('agenticDepth.subtitle')}>
      {loading ? (
        <EmptyState>{t('common.loading')}</EmptyState>
      ) : ratios.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildAgenticDepthOption(ratios, theme, {
            tooltip: { count: t('agenticDepth.tooltip.count') },
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
