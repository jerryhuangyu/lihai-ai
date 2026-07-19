import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { useResolvedRange } from '../filter/FilterBar'
import { sliceByDate } from '../filter/slice'
import { agentShareFrom } from '../../aggregate/analytics'
import { buildAgentShareOption } from './agentShareOption'

export function AgentShareCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  const range = useResolvedRange()
  if (!agg) return null
  const data = agentShareFrom(sliceByDate(agg.sessionMeta, range))
  return (
    <Card title={t('agentShare.title')}>
      {data.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart option={buildAgentShareOption(data, theme)} style={{ height: 300 }} />
      )}
    </Card>
  )
}
