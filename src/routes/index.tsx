import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { DailyCostCard } from '@/features/charts/DailyCostCard'
import { WhyTodayCard } from '@/features/charts/WhyTodayCard'
import { CostByTokenTypeCard } from '@/features/charts/CostByTokenTypeCard'
import { TokenCompositionCard } from '@/features/charts/TokenCompositionCard'
import { ModelTimelineCard } from '@/features/charts/ModelTimelineCard'
import { ModelEfficiencyCard } from '@/features/charts/ModelEfficiencyCard'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'
import { KpiRow } from '@/features/kpi/KpiRow'
import { LiveStatusRow } from '@/features/kpi/LiveStatusRow'
import { FilterBar } from '@/features/filter/FilterBar'

export const Route = createFileRoute('/')({ component: Overview })

export function Overview() {
  const { t } = useTranslation('dashboard')
  return (
    <div className="flex flex-col gap-4">
      {/* Live status first: it's the one thing NOT driven by the date filter, so
          keeping it above the range-scoped KPIs + charts avoids splitting the
          filter-linked content. Renders nothing when no block is active. */}
      <LiveStatusRow />
      {/* Filter sits above the range-scoped content it controls; live status
          above stays outside its scope. */}
      <div className="flex justify-end">
        <FilterBar />
      </div>
      <KpiRow />

      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">{t('overview.sections.cost')}</h2>
        <DashboardGrid>
          <DailyCostCard />
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
