import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { buildSessionDistOption } from './sessionDistOption'

export function SessionDistCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title={t('sessionDist.title')} subtitle={t('sessionDist.subtitle')}>
      {agg.sessionDistribution.totals.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildSessionDistOption(agg.sessionDistribution, theme, {
            tooltip: { sessionCount: t('sessionDist.tooltip.sessionCount') },
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
