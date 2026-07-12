import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DailyCostCard } from '@/features/charts/DailyCostCard'
import { ProjectionCard } from '@/features/charts/ProjectionCard'
import { WhyTodayCard } from '@/features/charts/WhyTodayCard'
import { CostByTokenTypeCard } from '@/features/charts/CostByTokenTypeCard'
import { TokenCompositionCard } from '@/features/charts/TokenCompositionCard'
import { ModelTimelineCard } from '@/features/charts/ModelTimelineCard'
import { ModelEfficiencyCard } from '@/features/charts/ModelEfficiencyCard'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'
import { KpiRow } from '@/features/kpi/KpiRow'

export const Route = createFileRoute('/')({ component: Overview })

export function Overview() {
  const { t } = useTranslation('dashboard')
  return (
    <div className="flex flex-col gap-4">
      <KpiRow />

      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">{t('overview.sections.cost')}</h2>
        <DashboardGrid>
          <DailyCostCard />
          <ProjectionCard />
          <WhyTodayCard />
          <CostByTokenTypeCard />
        </DashboardGrid>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">{t('overview.sections.usageComposition')}</h2>
        <DashboardGrid>
          <TokenCompositionCard />
          <ModelTimelineCard />
          <ModelEfficiencyCard />
        </DashboardGrid>
      </div>
    </div>
  )
}
