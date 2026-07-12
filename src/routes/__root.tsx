import { createRootRoute, Outlet } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImportPanel } from '@/features/import/ImportPanel'
import { FilterBar } from '@/features/filter/FilterBar'
import { useHasData } from '@/ui/selectors'
import { useDataStore } from '@/store/useDataStore'

export const Route = createRootRoute({ component: RootLayout })

export function RootContent() {
  const hasData = useHasData()
  const coverage = useDataStore((s) => s.coverage)
  const generatedAt = useDataStore((s) => s.generatedAt)
  const reset = useDataStore((s) => s.reset)

  if (!hasData) {
    return (
      <div className="py-8">
        <ImportPanel />
      </div>
    )
  }

  const covPct = coverage ? Math.round((coverage.matchedCost / (coverage.totalCost || 1)) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          成本歸屬涵蓋率 {covPct}%
          {generatedAt && ` · 匯出於 ${new Date(generatedAt).toLocaleString()}`}
        </span>
        <div className="flex items-center gap-3">
          <FilterBar />
          <button className="hover:text-foreground underline" onClick={reset}>
            重新匯入
          </button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}

function RootLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider className={cn('[--app-wrapper-max-width:80rem]')}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className={cn('flex flex-1 flex-col p-4 md:p-6', 'mx-auto w-full max-w-(--app-wrapper-max-width)')}>
            <RootContent />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
