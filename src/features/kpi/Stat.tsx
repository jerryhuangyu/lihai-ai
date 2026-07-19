import { useTranslation } from 'react-i18next'
import { Card } from '../../ui/Card'
import { deltaLabel } from '../../ui/format'

export function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const { t } = useTranslation('dashboard')
  const d = delta === undefined ? null : deltaLabel(delta)
  const color = d?.dir === 'up' ? 'text-emerald-600' : d?.dir === 'down' ? 'text-rose-600' : 'text-muted-foreground'
  return (
    <Card>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {d && <p className={`mt-1 text-xs ${color}`}>{t('kpi.deltaVsYesterday', { delta: d.text })}</p>}
    </Card>
  )
}
