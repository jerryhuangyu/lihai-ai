import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ImportPanel } from '@/features/import/ImportPanel'
import { useHasData } from '@/ui/selectors'
import { useDataStore } from '@/store/useDataStore'

export const Route = createRootRoute({ component: RootLayout })

export function RootContent() {
  const { t } = useTranslation('shell')
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
          {t('root.costCoverage', { pct: covPct })}
          {generatedAt && ` · ${t('root.exportedAt', { date: new Date(generatedAt).toLocaleString() })}`}
        </span>
        <button type="button" className="hover:text-foreground underline" onClick={reset}>
          {t('root.reimport')}
        </button>
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
