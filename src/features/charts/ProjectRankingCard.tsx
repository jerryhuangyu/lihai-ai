import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { EChart } from '../../viz/EChart'
import { useChartTheme } from '../../viz/theme'
import { useFilteredEventCards } from '../filter/useFilteredEventCards'
import { buildProjectRankingOption } from './projectRankingOption'

export function ProjectRankingCard() {
  const { projectRanking, loading } = useFilteredEventCards()
  const theme = useChartTheme()
  return (
    <Card title="專案花費排行" subtitle="需 JSONL 才能歸屬到專案">
      {loading ? (
        <EmptyState>載入中…</EmptyState>
      ) : projectRanking.length === 0 ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildProjectRankingOption(projectRanking, theme)} style={{ height: 320 }} />
      )}
    </Card>
  )
}
