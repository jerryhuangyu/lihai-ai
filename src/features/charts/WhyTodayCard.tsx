import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function WhyTodayCard() {
  const agg = useAggregates()
  if (!agg) return null
  const { delta, byModel } = agg.whyToday
  const top = byModel.filter((m) => Math.abs(m.delta) > 0.005).slice(0, 5)
  const sign = delta >= 0 ? '+' : ''
  return (
    <Card title="今天為什麼花這麼多" subtitle="今日 vs 近 7 日均，依模型拆解">
      <p className={`text-2xl font-semibold tabular-nums ${delta >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
        {sign}{usd(delta)}
      </p>
      <p className="text-muted-foreground mb-3 text-xs">vs 近 7 日均</p>
      <ul className="space-y-1 text-sm">
        {top.length === 0 && <li className="text-muted-foreground">今日與近期持平</li>}
        {top.map((m) => (
          <li key={m.model} className="flex justify-between tabular-nums">
            <span className="text-muted-foreground">{m.model}</span>
            <span className={m.delta >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {m.delta >= 0 ? '+' : ''}{usd(m.delta)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
