import type { CcusageBlock } from '../../domain/types'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function LiveBlock({ block }: { block: CcusageBlock }) {
  const start = new Date(block.startTime).getTime()
  const end = new Date(block.endTime).getTime()
  const span = end - start
  const now = Date.now()
  const progress = span > 0 ? Math.min(1, Math.max(0, (now - start) / span)) : 0
  const remainMin = span > 0 ? Math.max(0, Math.round((end - now) / 60000)) : 0

  return (
    <Card title="目前 5 小時計費區塊" subtitle={`剩餘約 ${remainMin} 分鐘`}>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>已花 {usd(block.costUSD)}</span>
        {block.projection && <span>預估總額 {usd(block.projection.totalCost)}</span>}
      </div>
    </Card>
  )
}
