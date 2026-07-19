import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { buildSessionContextOption } from './sessionContextOption'

export function SessionContextCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title={t('sessionContext.title')} subtitle={t('sessionContext.subtitle')}>
      {(agg.sessionContextPeak?.peaks?.length ?? 0) === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildSessionContextOption(agg.sessionContextPeak, theme, {
            tooltip: { sessionCount: t('sessionContext.tooltip.sessionCount') },
            window200k: t('sessionContext.window200k'),
            window1m: t('sessionContext.window1m'),
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
