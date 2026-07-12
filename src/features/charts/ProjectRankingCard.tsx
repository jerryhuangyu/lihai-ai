import { useTranslation } from 'react-i18next'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { EChart } from '../../viz/EChart'
import { useChartTheme } from '../../viz/theme'
import { useFilteredEventCards } from '../filter/useFilteredEventCards'
import { buildProjectRankingOption } from './projectRankingOption'

export function ProjectRankingCard() {
  const { t } = useTranslation('dashboard')
  const { projectRanking, loading } = useFilteredEventCards()
  const theme = useChartTheme()
  return (
    <Card title={t('projectRanking.title')} subtitle={t('projectRanking.subtitle')}>
      {loading ? (
        <EmptyState>{t('common.loading')}</EmptyState>
      ) : projectRanking.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart option={buildProjectRankingOption(projectRanking, theme)} style={{ height: 320 }} />
      )}
    </Card>
  )
}
