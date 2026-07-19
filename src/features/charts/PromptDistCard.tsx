import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { buildPromptDistOption } from './promptDistOption'

export function PromptDistCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null
  const data = sliceByDate(agg.promptStats, range)
  return (
    <Card title={t('promptDist.title')} subtitle={t('promptDist.subtitle')}>
      {data.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildPromptDistOption(data, theme, {
            seriesTyped: t('promptDist.seriesTyped'),
            seriesAll: t('promptDist.seriesAll'),
            tooltip: { count: t('promptDist.tooltip.count') },
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
