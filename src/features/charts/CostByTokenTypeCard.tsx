import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { PRICING_META } from '../../pricing/outputRate'
import { buildCostByTokenTypeOption } from './costByTokenTypeOption'

export function CostByTokenTypeCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null

  const d = agg.costByTokenType
  const hasData = d && (d.output.cost > 0 || d.cacheCreation.cost > 0 || d.cacheRead.cost > 0 || d.input.cost > 0)

  return (
    <Card title="花費組成" subtitle="你的錢花在哪種 token · 對比用量看出「量大不等於錢多」">
      {!hasData ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildCostByTokenTypeOption(d, theme)} style={{ height: 180 }} />
      )}
      <p className="text-muted-foreground mt-2 text-xs">
        $ 拆分為估計：依 LiteLLM 各類型牌價比例分攤，總額仍等於 ccusage 實際花費 · Cache
        讀取＝重複讀取既有上下文（量大但單價低）· 定價更新於 {PRICING_META.fetchedAt}
      </p>
    </Card>
  )
}
