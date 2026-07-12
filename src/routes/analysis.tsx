import { createFileRoute } from '@tanstack/react-router'
import { ProjectRankingCard } from '@/features/charts/ProjectRankingCard'
import { HourHeatmapCard } from '@/features/charts/HourHeatmapCard'
import { CacheTrendCard } from '@/features/charts/CacheTrendCard'
import { SessionDistCard } from '@/features/charts/SessionDistCard'
import { AgentShareCard } from '@/features/charts/AgentShareCard'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'

export const Route = createFileRoute('/analysis')({ component: Analysis })

export function Analysis() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">專案與時段</h2>
        <DashboardGrid>
          <ProjectRankingCard />
          <HourHeatmapCard />
        </DashboardGrid>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">效率與分布</h2>
        <DashboardGrid>
          <CacheTrendCard />
          <SessionDistCard />
          <AgentShareCard />
        </DashboardGrid>
      </div>
    </div>
  )
}
