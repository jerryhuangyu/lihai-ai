import { createFileRoute } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ProjectRankingCard } from '@/features/charts/ProjectRankingCard'
import { HourHeatmapCard } from '@/features/charts/HourHeatmapCard'
import { CacheTrendCard } from '@/features/charts/CacheTrendCard'
import { SessionDistCard } from '@/features/charts/SessionDistCard'
import { SessionContextCard } from '@/features/charts/SessionContextCard'
import { SessionScaleCard } from '@/features/charts/SessionScaleCard'
import { CadenceCard } from '@/features/charts/CadenceCard'
import { PromptDistCard } from '@/features/charts/PromptDistCard'
import { AgenticDepthCard } from '@/features/charts/AgenticDepthCard'
import { AgentShareCard } from '@/features/charts/AgentShareCard'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'
import { FilterBar } from '@/features/filter/FilterBar'

export const Route = createFileRoute('/analysis')({ component: Analysis })

export function Analysis() {
  const { t } = useTranslation('dashboard')
  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <FilterBar />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">{t('analysis.sections.projectAndTime')}</h2>
        <DashboardGrid>
          <ProjectRankingCard />
          <HourHeatmapCard />
        </DashboardGrid>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">
          {t('analysis.sections.efficiencyAndDistribution')}
        </h2>
        <DashboardGrid>
          <CacheTrendCard />
          <SessionDistCard />
          <SessionContextCard />
          <SessionScaleCard />
          <CadenceCard />
          <PromptDistCard />
          <AgenticDepthCard />
          <AgentShareCard />
        </DashboardGrid>
      </div>
    </div>
  )
}
