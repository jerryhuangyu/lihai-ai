import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { buildModelTimelineOption } from './modelTimelineOption'

export function ModelTimelineCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null
  const data = sliceByDate(agg.modelTimeline, range)
  return (
    <Card title={t('modelTimeline.title')}>
      {data.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart option={buildModelTimelineOption(data, theme, { other: t('modelTimeline.other') })} />
      )}
    </Card>
  )
}
