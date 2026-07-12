import { useTranslation } from 'react-i18next'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { EChart } from '../../viz/EChart'
import { useChartTheme } from '../../viz/theme'
import { useFilteredEventCards } from '../filter/useFilteredEventCards'
import { buildHourHeatmapOption } from './hourHeatmapOption'

export function HourHeatmapCard() {
  const { t } = useTranslation('dashboard')
  const { hourHeatmap, loading } = useFilteredEventCards()
  const theme = useChartTheme()
  return (
    <Card title={t('hourHeatmap.title')} subtitle={t('hourHeatmap.subtitle')} className="lg:col-span-2">
      {loading ? (
        <EmptyState>{t('common.loading')}</EmptyState>
      ) : hourHeatmap.length === 0 ? (
        <EmptyState>{t('common.noData')}</EmptyState>
      ) : (
        <EChart
          option={buildHourHeatmapOption(hourHeatmap, theme, {
            weekdays: t('hourHeatmap.weekdays', { returnObjects: true }),
            tooltip: {
              shareOfTotal: t('hourHeatmap.tooltip.shareOfTotal'),
              daysActive: t('hourHeatmap.tooltip.daysActive'),
              recentDate: t('hourHeatmap.tooltip.recentDate'),
            },
          })}
          style={{ height: 300 }}
        />
      )}
    </Card>
  )
}
