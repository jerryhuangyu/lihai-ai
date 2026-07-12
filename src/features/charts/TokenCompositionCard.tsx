import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { buildTokenCompositionOption } from './tokenCompositionOption'

export function TokenCompositionCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  const [normalized, setNormalized] = useState(false)
  if (!agg) return null
  const data = sliceByDate(agg.tokenComposition, range)
  return (
    <Card
      title={t('tokenComposition.title')}
      actions={
        <button
          type="button"
          onClick={() => setNormalized((v) => !v)}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
        >
          {normalized ? t('tokenComposition.toggleNormalized') : t('tokenComposition.toggleAbsolute')}
        </button>
      }
    >
      {data.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildTokenCompositionOption(data, theme, normalized, {
            series: {
              cacheCreation: t('tokenComposition.series.cacheCreation'),
              cacheRead: t('tokenComposition.series.cacheRead'),
            },
          })}
        />
      )}
    </Card>
  )
}
