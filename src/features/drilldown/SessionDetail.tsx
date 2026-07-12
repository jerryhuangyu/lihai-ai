import { useEffect, useState } from 'react'
import type { CostedEvent } from '../../domain/types'
import { eventsBySession } from '../../store/rawDb'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { usd, tokensCompact } from '../../ui/format'
import { buildSessionTimelineOption } from './sessionTimelineOption'

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const [events, setEvents] = useState<CostedEvent[] | null>(null)
  const theme = useChartTheme()
  useEffect(() => {
    let cancelled = false
    eventsBySession(sessionId).then((e) => !cancelled && setEvents(e))
    return () => { cancelled = true }
  }, [sessionId])
  if (!events) return <p className="text-muted-foreground text-sm">載入中…</p>
  const cost = events.reduce((a, e) => a + e.cost, 0)
  const tok = events.reduce((a, e) => a + e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead, 0)
  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted-foreground flex gap-4 text-xs">
        <span>{events.length} 則訊息</span>
        <span>成本 {usd(cost)}</span>
        <span>{tokensCompact(tok)} tokens</span>
      </div>
      <EChart option={buildSessionTimelineOption(events, theme)} style={{ height: 220 }} />
    </div>
  )
}
