export function Card({
  title,
  subtitle,
  actions,
  children,
  className,
}: {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`bg-card text-card-foreground rounded-xl border p-4 ${className ?? ''}`}>
      {(title || actions) && (
        <header className="mb-3 flex items-start justify-between gap-2">
          <div>
            {title && <h3 className="text-sm font-medium">{title}</h3>}
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      {children}
    </section>
  )
}
