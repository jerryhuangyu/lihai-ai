import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function ProjectionCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  if (!agg) return null
  const blockProj = agg.activeBlock?.projection?.totalCost
  return (
    <Card title={t('projection.title')}>
      <p className="text-muted-foreground text-xs">{t('projection.monthEnd')}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{usd(agg.monthEndProjection)}</p>
      {blockProj !== undefined && (
        <p className="text-muted-foreground mt-2 text-xs">
          {t('projection.blockProjection', { amount: usd(blockProj) })}
        </p>
      )}
    </Card>
  )
}
