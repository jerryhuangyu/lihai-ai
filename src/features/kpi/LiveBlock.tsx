import { useTranslation } from 'react-i18next'
import type { CcusageBlock } from '../../domain/types'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function LiveBlock({ block }: { block: CcusageBlock }) {
  const { t } = useTranslation('dashboard')
  const start = new Date(block.startTime).getTime()
  const end = new Date(block.endTime).getTime()
  const span = end - start
  const now = Date.now()
  const progress = span > 0 ? Math.min(1, Math.max(0, (now - start) / span)) : 0
  const remainMin = span > 0 ? Math.max(0, Math.round((end - now) / 60000)) : 0

  return (
    <Card title={t('kpi.liveBlock.title')} subtitle={t('kpi.liveBlock.remaining', { minutes: remainMin })}>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>{t('kpi.liveBlock.spent', { amount: usd(block.costUSD) })}</span>
        {block.projection && (
          <span>{t('kpi.liveBlock.projected', { amount: usd(block.projection.totalCost) })}</span>
        )}
      </div>
    </Card>
  )
}
