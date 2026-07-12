import { useFilterStore } from './useFilterStore'
import { resolveRange, type RangePreset } from './range'

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: '7d', label: '近 7 日' },
  { key: '30d', label: '近 30 日' },
  { key: '90d', label: '近 90 日' },
  { key: 'all', label: '全部' },
]

export function useResolvedRange() {
  const preset = useFilterStore((s) => s.preset)
  return { preset, ...resolveRange(preset, new Date().toISOString().slice(0, 10)) }
}

export function FilterBar() {
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
          {p.label}
        </button>
      ))}
    </div>
  )
}
