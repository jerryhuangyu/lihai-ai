import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { outputRate, PRICING_META } from '../../pricing/outputRate'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { modelEfficiencyFromDaily } from '../../aggregate/modelDaily'
import { buildModelEfficiencyOption, type EfficiencyRow } from './modelEfficiencyOption'

export function ModelEfficiencyCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null

  const enriched = modelEfficiencyFromDaily(sliceByDate(agg.modelDaily, range)).map((m) => {
    const { rate, exact } = outputRate(m.model)
    return {
      model: m.model,
      listRate: rate,
      perTokenCost: m.costPerMillionToken,
      outputShare: m.outputShare,
      exact,
    }
  })
  const priced = enriched
    .filter((r): r is EfficiencyRow => r.listRate !== null)
    .sort((a, b) => a.listRate - b.listRate)
  const unpriced = enriched.filter((r) => r.listRate === null).map((r) => r.model)

  return (
    <Card title={t('modelEfficiency.title')} subtitle={t('modelEfficiency.subtitle')}>
      {priced.length === 0 ? (
        <EmptyState>{t('modelEfficiency.noPricingData')}</EmptyState>
      ) : (
        <EChart
          option={buildModelEfficiencyOption(priced, theme, {
            tooltip: {
              listPrice: t('modelEfficiency.tooltip.listPrice'),
              estimatedSuffix: t('modelEfficiency.tooltip.estimatedSuffix'),
              effectiveRate: t('modelEfficiency.tooltip.effectiveRate'),
              outputShare: t('modelEfficiency.tooltip.outputShare'),
            },
          })}
          style={{ height: 300 }}
        />
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        {t('modelEfficiency.footnote', { date: PRICING_META.fetchedAt })}
        {unpriced.length > 0 &&
          t('modelEfficiency.unpriced', { models: unpriced.join(t('common.listSeparator')) })}
      </p>
    </Card>
  )
}
