import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { buildAgentShareOption } from './agentShareOption'

export function AgentShareCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="Claude vs Codex（各 agent 成本佔比）">
      {agg.agentShare.length === 0 ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildAgentShareOption(agg.agentShare, theme)} style={{ height: 300 }} />
      )}
    </Card>
  )
}
