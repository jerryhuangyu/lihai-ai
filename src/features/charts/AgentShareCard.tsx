import { useTranslation } from 'react-i18next'
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { buildAgentShareOption } from './agentShareOption'

export function AgentShareCard() {
  const { t } = useTranslation('dashboard')
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title={t('agentShare.title')}>
      {agg.agentShare.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart option={buildAgentShareOption(agg.agentShare, theme)} style={{ height: 300 }} />
      )}
    </Card>
  )
}
