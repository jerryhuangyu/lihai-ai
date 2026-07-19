import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { CostedEvent } from '../../domain/types'
import { eventsBySession } from '../../store/rawDb'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { usd, tokensCompact } from '../../ui/format'
import { contextCurve } from '../../insights/spans'
import { buildSessionTimelineOption } from './sessionTimelineOption'
import { buildContextCurveOption } from './contextCurveOption'

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation('sessions')
  const agg = useAggregates()
  const [events, setEvents] = useState<CostedEvent[] | null>(null)
  const theme = useChartTheme()
  useEffect(() => {
    let cancelled = false
    eventsBySession(sessionId).then((e) => !cancelled && setEvents(e))
    return () => { cancelled = true }
  }, [sessionId])
  if (!events) return <p className="text-muted-foreground text-sm">{t('detail.loading')}</p>
  const cost = events.reduce((a, e) => a + e.cost, 0)
  const tok = events.reduce((a, e) => a + e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead, 0)
  const prompts = agg?.promptStats.find((p) => p.sessionId === sessionId)
  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted-foreground flex gap-4 text-xs">
        <span>{t('detail.messageCount', { count: events.length })}</span>
        {prompts && <span>{t('detail.prompts', { typed: prompts.typed, all: prompts.all })}</span>}
        <span>{t('detail.cost', { amount: usd(cost) })}</span>
        <span>{t('detail.tokens', { tokens: tokensCompact(tok) })}</span>
      </div>
      <EChart
        option={buildSessionTimelineOption(events, theme, { xAxisName: t('detail.timeline.xAxisName') })}
        style={{ height: 220 }}
      />
      <p className="text-muted-foreground text-xs">{t('detail.contextCurve.title')}</p>
      <EChart
        option={buildContextCurveOption(contextCurve(events), theme, { xAxisName: t('detail.contextCurve.xAxisName') })}
        style={{ height: 220 }}
      />
    </div>
  )
}
