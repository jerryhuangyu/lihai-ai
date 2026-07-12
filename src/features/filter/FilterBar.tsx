import { useTranslation } from 'react-i18next'
import { useFilterStore } from './useFilterStore'
import { resolveRange, type RangePreset } from './range'

// labelKey 型別固定為既有 i18n key 的字面量聯集，讓 t() 保有型別檢查（非泛用 string）。
const PRESETS: {
  key: RangePreset
  labelKey: 'filter.presets.last7d' | 'filter.presets.last30d' | 'filter.presets.last90d' | 'filter.presets.all'
}[] = [
  { key: '7d', labelKey: 'filter.presets.last7d' },
  { key: '30d', labelKey: 'filter.presets.last30d' },
  { key: '90d', labelKey: 'filter.presets.last90d' },
  { key: 'all', labelKey: 'filter.presets.all' },
]

export function useResolvedRange() {
  const preset = useFilterStore((s) => s.preset)
  return { preset, ...resolveRange(preset, new Date().toISOString().slice(0, 10)) }
}

export function FilterBar() {
  const { t } = useTranslation('dashboard')
  const preset = useFilterStore((s) => s.preset)
  const setPreset = useFilterStore((s) => s.setPreset)
  return (
    <div className="flex gap-1">
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => setPreset(p.key)}
          className={`rounded-md px-3 py-1 text-xs ${
            preset === p.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          {t(p.labelKey)}
        </button>
      ))}
    </div>
  )
}
