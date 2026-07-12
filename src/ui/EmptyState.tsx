export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm">
      {children}
    </div>
  )
}
