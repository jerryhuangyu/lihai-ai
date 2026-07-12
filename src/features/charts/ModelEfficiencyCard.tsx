import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { outputRate, PRICING_META } from '../../pricing/outputRate'
import { buildModelEfficiencyOption, type EfficiencyRow } from './modelEfficiencyOption'

export function ModelEfficiencyCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null

  const enriched = agg.modelEfficiency.map((m) => {
    const { rate, exact } = outputRate(m.model)
    return {
      model: m.model,
      listRate: rate,
      perTokenCost: m.costPerMillionToken,
      outputShare: m.outputShare,
      exact,
    }
  })
  const priced = enriched
    .filter((r): r is EfficiencyRow => r.listRate !== null)
    .sort((a, b) => a.listRate - b.listRate)
  const unpriced = enriched.filter((r) => r.listRate === null).map((r) => r.model)

  return (
    <Card title="模型成本效率" subtitle="各模型的官方定價，數字越高越貴；滑過任一列，看你實際的平均花費">
      {priced.length === 0 ? (
        <EmptyState>尚無公開定價資料</EmptyState>
      ) : (
        <EChart option={buildModelEfficiencyOption(priced, theme)} style={{ height: 300 }} />
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        list 定價來源 LiteLLM · 更新於 {PRICING_META.fetchedAt}
        {unpriced.length > 0 && `　·　無公開定價：${unpriced.join('、')}`}
      </p>
    </Card>
  )
}
