export function DashboardGrid({ children }: { children?: React.ReactNode }) {
  return (
    <div data-testid="dashboard-grid" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {children}
    </div>
  )
}
