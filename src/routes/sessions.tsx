import { createFileRoute } from '@tanstack/react-router'
import { SessionListCard } from '@/features/drilldown/SessionListCard'
import { DashboardGrid } from '@/features/dashboard/DashboardGrid'

export const Route = createFileRoute('/sessions')({ component: Sessions })

export function Sessions() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h2 className="text-muted-foreground text-sm font-medium">Session 明細</h2>
        <DashboardGrid>
          <SessionListCard />
        </DashboardGrid>
      </div>
    </div>
  )
}
