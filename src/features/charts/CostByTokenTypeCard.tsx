import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { PRICING_META } from '../../pricing/outputRate'
import { buildCostByTokenTypeOption } from './costByTokenTypeOption'

export function CostByTokenTypeCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null

  const d = agg.costByTokenType
  const hasData = d && (d.output.cost > 0 || d.cacheCreation.cost > 0 || d.cacheRead.cost > 0 || d.input.cost > 0)

  return (
    <Card title={t('costByTokenType.title')} subtitle={t('costByTokenType.subtitle')}>
      {!hasData ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildCostByTokenTypeOption(d, theme, {
            rows: { usage: t('costByTokenType.rows.usage'), cost: t('costByTokenType.rows.cost') },
            series: {
              cacheCreation: t('costByTokenType.series.cacheCreation'),
              cacheRead: t('costByTokenType.series.cacheRead'),
            },
          })}
          style={{ height: 180 }}
        />
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        {t('costByTokenType.footnote', { date: PRICING_META.fetchedAt })}
      </p>
    </Card>
  )
}
