# AI Usage Dashboard — UI Plan 2c (date-range filter + drill-down + polish)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the interaction layer — a global **date-range filter** (presets) that re-slices the time-series + KPI cards (pure client slice) AND recomputes the project-ranking + hour-heatmap cards from IndexedDB costed events within range; a **session drill-down** (click a session → per-message cost/token timeline); and two polish items. Dimension filters (project/model/agent/branch) are deferred to Plan 2d.

**Architecture (ADR):** The dashboard has two data provenances (see `docs/superpowers/specs`): ccusage `daily` rows back the cost/token/cache/model time-series + KPIs (all agents, no project/branch dimension); Claude-only costed events (IndexedDB) back project-ranking + heatmap. A **date-range** filter is the one filter both provenances support: daily series slice by `date` (pure); costed events filter by `ts` (async recompute). Dimension filters would require rebuilding the daily cards from costed events, which drops non-Claude agents — deferred to 2d with that tradeoff documented. This plan keeps the pure aggregates untouched and layers filtering on top via selectors + an async recompute hook.

**Tech Stack:** React + TS, zustand (filter slice), Dexie (event recompute), ECharts, Vitest + @testing-library.

## Global Constraints

- pnpm. TS strict. Verify types with **`pnpm build`** (bare `tsc --noEmit` no-ops here).
- Filter is **date-range only** in 2c. Range presets: 近 7 日 / 近 30 日 / 近 90 日 / 全部. Default 全部.
- Pure slicing/recompute functions take the range as `{ from: string; to: string }` ISO-date bounds (inclusive), never read `Date.now()` inside; `resolveRange(preset, todayIso)` computes bounds from a passed `todayIso`.
- Cards the range affects: dailyCost, tokenComposition, cacheTrend, modelTimeline, KPIs (pure slice); projectRanking, hourHeatmap (async IndexedDB recompute). Cards it does NOT affect (ccusage-session/whole-dataset): agentShare, modelEfficiency, sessionDistribution, projection, whyToday — these show a subtle "全期間" hint when a non-全部 range is active.
- dataviz constraints from 2a/2b unchanged. Dark via `.dark` class.
- Money via `usd()`, tokens via `tokensCompact()`.

---

### Task 1: Filter store + range resolver + sliced time-series/KPI selectors

**Files:**
- Create: `src/features/filter/useFilterStore.ts`, `src/features/filter/range.ts`, `src/features/filter/slice.ts`
- Test: `src/features/filter/range.test.ts`, `src/features/filter/slice.test.ts`

**Interfaces:**
- Produces:
  - `type RangePreset = '7d' | '30d' | '90d' | 'all'`
  - `useFilterStore` — `{ preset: RangePreset; setPreset(p): void }` (default `'all'`, NOT persisted — a fresh view each load).
  - `resolveRange(preset, todayIso): { from: string; to: string }` — `all` → `{from:'0000-01-01', to:'9999-12-31'}`; `7d`/`30d`/`90d` → `[todayIso - (n-1) days, todayIso]` (inclusive of today).
  - `sliceByDate<T extends {date:string}>(rows, range): T[]`; `sliceKpis(dailyCostRows, range)` → `{ totalCost, avgPerDay, deltaPct }` recomputed over the slice.

- [ ] **Step 1: range test (TDD)** — `src/features/filter/range.test.ts`:

```ts
import { expect, test } from 'vitest'
import { resolveRange } from './range'

test('all → wide open bounds', () => {
  expect(resolveRange('all', '2026-07-10')).toEqual({ from: '0000-01-01', to: '9999-12-31' })
})
test('7d → last 7 inclusive days ending today', () => {
  expect(resolveRange('7d', '2026-07-10')).toEqual({ from: '2026-07-04', to: '2026-07-10' })
})
test('30d spans a month boundary', () => {
  expect(resolveRange('30d', '2026-07-10')).toEqual({ from: '2026-06-11', to: '2026-07-10' })
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `range.ts`:**

```ts
export type RangePreset = '7d' | '30d' | '90d' | 'all'

const DAYS: Record<Exclude<RangePreset, 'all'>, number> = { '7d': 7, '30d': 30, '90d': 90 }

export function resolveRange(preset: RangePreset, todayIso: string): { from: string; to: string } {
  if (preset === 'all') return { from: '0000-01-01', to: '9999-12-31' }
  const [y, m, d] = todayIso.split('-').map(Number)
  // deterministic UTC date math (no Date.now)
  const end = Date.UTC(y, m - 1, d)
  const from = new Date(end - (DAYS[preset] - 1) * 86_400_000).toISOString().slice(0, 10)
  return { from, to: todayIso }
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: slice test (TDD)** — `src/features/filter/slice.test.ts`:

```ts
import { expect, test } from 'vitest'
import { sliceByDate, sliceKpis } from './slice'

const rows = [
  { date: '2026-07-08', cost: 10 },
  { date: '2026-07-09', cost: 20 },
  { date: '2026-07-10', cost: 30 },
]
test('sliceByDate keeps inclusive bounds', () => {
  expect(sliceByDate(rows, { from: '2026-07-09', to: '2026-07-10' })).toHaveLength(2)
})
test('sliceKpis recomputes total/avg/delta over the slice', () => {
  const k = sliceKpis(rows, { from: '2026-07-09', to: '2026-07-10' })
  expect(k.totalCost).toBe(50)
  expect(k.avgPerDay).toBe(25)
  expect(k.deltaPct).toBeCloseTo(50, 6) // 20 → 30
})
```

- [ ] **Step 6: Run → FAIL.**

- [ ] **Step 7: `slice.ts`:**

```ts
export function sliceByDate<T extends { date: string }>(rows: T[], range: { from: string; to: string }): T[] {
  return rows.filter((r) => r.date >= range.from && r.date <= range.to)
}

export function sliceKpis(
  dailyCost: { date: string; cost: number }[],
  range: { from: string; to: string },
): { totalCost: number; avgPerDay: number; deltaPct: number } {
  const rows = sliceByDate(dailyCost, range).sort((a, b) => a.date.localeCompare(b.date))
  const totalCost = rows.reduce((a, r) => a + r.cost, 0)
  const avgPerDay = rows.length ? totalCost / rows.length : 0
  let deltaPct = 0
  if (rows.length >= 2) {
    const prev = rows[rows.length - 2].cost
    const last = rows[rows.length - 1].cost
    deltaPct = prev > 0 ? ((last - prev) / prev) * 100 : 0
  }
  return { totalCost, avgPerDay, deltaPct }
}
```

- [ ] **Step 8: `useFilterStore.ts`:**

```ts
import { create } from 'zustand'
import type { RangePreset } from './range'

interface FilterState {
  preset: RangePreset
  setPreset: (p: RangePreset) => void
}
export const useFilterStore = create<FilterState>((set) => ({
  preset: 'all',
  setPreset: (preset) => set({ preset }),
}))
```

- [ ] **Step 9: Run all + build + commit**

```bash
git add src/features/filter
git commit -m "feat(2c): filter store + range resolver + sliced time-series/KPI selectors"
```

---

### Task 2: FilterBar + wire time-series/KPI cards to the range

**Files:**
- Create: `src/features/filter/FilterBar.tsx`
- Modify: `src/features/dashboard/Dashboard.tsx` (render FilterBar), the 4 time-series cards (`DailyCostCard`, `TokenCompositionCard`, `ModelTimelineCard`, `CacheTrendCard`) and `KpiRow` to read the resolved range and slice.
- Test: `src/features/filter/FilterBar.dom.test.tsx`

**Interfaces:**
- Consumes: `useFilterStore`, `resolveRange`, `sliceByDate`, `sliceKpis`.
- Produces: `<FilterBar />` — 4 preset buttons (active state); a `useResolvedRange()` hook returning `{from,to}` from the store (uses `new Date().toISOString().slice(0,10)` as today — the one impure boundary, at the hook edge).

- [ ] **Step 1: FilterBar test (TDD, jsdom)** — `FilterBar.dom.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { FilterBar } from './FilterBar'
import { useFilterStore } from './useFilterStore'

beforeEach(() => useFilterStore.setState({ preset: 'all' }))

test('renders presets and updates the store on click', () => {
  render(<FilterBar />)
  fireEvent.click(screen.getByRole('button', { name: '近 7 日' }))
  expect(useFilterStore.getState().preset).toBe('7d')
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `FilterBar.tsx` + `useResolvedRange`:**

```tsx
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
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Wire the 4 time-series cards to slice**

In each of `DailyCostCard`, `TokenCompositionCard`, `ModelTimelineCard`, `CacheTrendCard`: import `useResolvedRange` + `sliceByDate`, and slice the aggregate array before passing to the option builder. E.g. in `DailyCostCard`:
```tsx
const range = useResolvedRange()
const data = sliceByDate(agg.dailyCost, range)
// ... buildDailyCostOption(data, theme)
```
`ModelTimelineCard` slices `agg.modelTimeline` (has `date`); `TokenCompositionCard` slices `agg.tokenComposition`; `CacheTrendCard` slices `agg.cacheTrend`.

- [ ] **Step 6: Wire KpiRow to sliced KPIs**

In `KpiRow`, replace `agg.kpis` usage of totalCost/avgPerDay/deltaPct with `sliceKpis(agg.dailyCost, useResolvedRange())`. Keep burnRatePerHour from `agg.kpis` (block-based, range-independent). LiveBlock/projection slots unchanged.

- [ ] **Step 7: Render FilterBar in Dashboard header**

In `Dashboard.tsx`, render `<FilterBar />` in the header row (next to coverage / 重新匯入).

- [ ] **Step 8: Build + suite + commit**

`pnpm build` green, `pnpm exec vitest run` green.
```bash
git add src/features/filter src/features/charts src/features/kpi src/features/dashboard/Dashboard.tsx
git commit -m "feat(2c): FilterBar + date-range slicing on time-series + KPI cards"
```

---

### Task 3: rawDb allEvents + pure event-range recompute

**Files:**
- Modify: `src/store/rawDb.ts` (add `allEvents()`)
- Create: `src/features/filter/recompute.ts`
- Test: `src/features/filter/recompute.test.ts`, `src/store/rawDb.test.ts` (add allEvents test)

**Interfaces:**
- Produces:
  - `allEvents(): Promise<CostedEvent[]>` (rawDb).
  - `recomputeEventCards(events, range, tzOffsetMinutes): { projectRanking, hourHeatmap }` — filters events by `ts` date within range, then runs the existing `projectRanking` + `hourHeatmap` aggregates.

- [ ] **Step 1: recompute test (TDD)** — `src/features/filter/recompute.test.ts`:

```ts
import { expect, test } from 'vitest'
import { recomputeEventCards } from './recompute'
import type { CostedEvent } from '../../domain/types'

const ev = (ts: string, project: string, cost: number): CostedEvent => ({
  sessionId: 's', project, agent: 'claude', ts, model: 'm',
  tokens: { input: 1, output: 0, cacheCreation: 0, cacheRead: 0 }, cost,
})

test('filters events by ts date within range then re-aggregates', () => {
  const events = [ev('2026-07-01T10:00:00Z', 'a', 5), ev('2026-07-20T10:00:00Z', 'b', 7)]
  const out = recomputeEventCards(events, { from: '2026-07-15', to: '2026-07-31' }, 0)
  expect(out.projectRanking).toEqual([{ project: 'b', cost: 7, tokens: 1 }])
  expect(out.hourHeatmap.reduce((a, c) => a + c.cost, 0)).toBeCloseTo(7, 6)
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `recompute.ts`:**

```ts
import type { CostedEvent } from '../../domain/types'
import { projectRanking, hourHeatmap } from '../../aggregate/analytics'

export function recomputeEventCards(
  events: CostedEvent[],
  range: { from: string; to: string },
  tzOffsetMinutes: number,
) {
  const filtered = events.filter((e) => {
    const d = e.ts.slice(0, 10)
    return d >= range.from && d <= range.to
  })
  return {
    projectRanking: projectRanking(filtered),
    hourHeatmap: hourHeatmap(filtered, tzOffsetMinutes),
  }
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Add allEvents to rawDb + test**

In `src/store/rawDb.ts`:
```ts
export async function allEvents(): Promise<CostedEvent[]> {
  return db.events.toArray()
}
```
Append to `src/store/rawDb.test.ts`:
```ts
test('allEvents returns everything saved', async () => {
  await saveEvents(ev) // reuse the file's existing `ev` fixture
  expect(await allEvents()).toHaveLength(ev.length)
})
```
(Import `allEvents` in the test.)

- [ ] **Step 6: Build + suite + commit**

```bash
git add src/store/rawDb.ts src/store/rawDb.test.ts src/features/filter/recompute.ts src/features/filter/recompute.test.ts
git commit -m "feat(2c): rawDb allEvents + pure event-range recompute"
```

---

### Task 4: Wire project + heatmap cards to async filtered recompute

**Files:**
- Create: `src/features/filter/useFilteredEventCards.ts`
- Modify: `ProjectRankingCard.tsx`, `HourHeatmapCard.tsx`
- Test: `src/features/filter/useFilteredEventCards.dom.test.tsx`

**Interfaces:**
- Produces:
  - `useFilteredEventCards()` — reads the resolved range; when `preset === 'all'`, returns the store's precomputed `aggregates.projectRanking/hourHeatmap` synchronously (no IndexedDB hit); otherwise loads `allEvents()` once, recomputes on range change, exposes `{ projectRanking, hourHeatmap, loading }`.

- [ ] **Step 1: Hook test (TDD, jsdom, fake-indexeddb)** — `useFilteredEventCards.dom.test.tsx`:

```tsx
// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { renderHook, waitFor } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { useFilteredEventCards } from './useFilteredEventCards'
import { useFilterStore } from './useFilterStore'
import { useDataStore } from '../../store/useDataStore'
import { saveEvents } from '../../store/rawDb'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(async () => {
  useFilterStore.setState({ preset: 'all' })
  const { aggregates, coverage, costed } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  await saveEvents(costed)
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('all → uses precomputed aggregates (sync, not loading)', () => {
  const { result } = renderHook(() => useFilteredEventCards())
  expect(result.current.loading).toBe(false)
  expect(result.current.projectRanking).toEqual(useDataStore.getState().aggregates!.projectRanking)
})

test('non-all → recomputes from IndexedDB', async () => {
  useFilterStore.setState({ preset: '90d' })
  const { result } = renderHook(() => useFilteredEventCards())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(Array.isArray(result.current.projectRanking)).toBe(true)
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `useFilteredEventCards.ts`:**

```ts
import { useEffect, useState } from 'react'
import { useResolvedRange } from './FilterBar'
import { useDataStore } from '../../store/useDataStore'
import { allEvents } from '../../store/rawDb'
import { recomputeEventCards } from './recompute'
import type { Aggregates } from '../../aggregate'

export function useFilteredEventCards(): {
  projectRanking: Aggregates['projectRanking']
  hourHeatmap: Aggregates['hourHeatmap']
  loading: boolean
} {
  const { preset, from, to } = useResolvedRange()
  const agg = useDataStore((s) => s.aggregates)
  const [state, setState] = useState<{
    projectRanking: Aggregates['projectRanking']
    hourHeatmap: Aggregates['hourHeatmap']
    loading: boolean
  }>({ projectRanking: [], hourHeatmap: [], loading: false })

  useEffect(() => {
    let cancelled = false
    if (!agg) return
    if (preset === 'all') {
      setState({ projectRanking: agg.projectRanking, hourHeatmap: agg.hourHeatmap, loading: false })
      return
    }
    setState((s) => ({ ...s, loading: true }))
    allEvents().then((events) => {
      if (cancelled) return
      const r = recomputeEventCards(events, { from, to }, new Date().getTimezoneOffset())
      setState({ ...r, loading: false })
    })
    return () => {
      cancelled = true
    }
  }, [agg, preset, from, to])

  return state
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Wire ProjectRankingCard + HourHeatmapCard**

Replace their `agg.projectRanking` / `agg.hourHeatmap` reads with `useFilteredEventCards()`. Show a subtle loading state (`<EmptyState>載入中…</EmptyState>` when `loading`), else the chart (empty-guard on the filtered array). Both still read `useChartTheme`.

- [ ] **Step 6: Build + suite + commit**

```bash
git add src/features/filter/useFilteredEventCards.ts src/features/filter/useFilteredEventCards.dom.test.tsx src/features/charts/ProjectRankingCard.tsx src/features/charts/HourHeatmapCard.tsx
git commit -m "feat(2c): project + heatmap recompute on date range (async IndexedDB)"
```

---

### Task 5: sessionSummaries aggregate

**Files:**
- Create: `src/aggregate/sessions.ts`
- Modify: `src/aggregate/index.ts` (add `sessionSummaries` to Aggregates + buildAggregates)
- Test: `src/aggregate/sessions.test.ts`

**Interfaces:**
- Produces:
  - `sessionSummaries(costed): SessionSummary[]` desc by cost — `SessionSummary = { sessionId; project; agent; gitBranch?; cost; tokens; firstTs; lastTs; models: string[] }`.
  - `Aggregates.sessionSummaries` added; `buildAggregates` includes it.

- [ ] **Step 1: Test (TDD)** — `src/aggregate/sessions.test.ts`:

```ts
import { expect, test } from 'vitest'
import { sessionSummaries } from './sessions'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
const { costed } = allocateCost(n.session, toMessageEvents(SAMPLE_BUNDLE.sessions))

test('rolls up per-session cost, tokens, ts span, models', () => {
  const s = sessionSummaries(costed)
  expect(s[0]).toMatchObject({ sessionId: 'sess-A', project: 'app', agent: 'claude' })
  expect(s[0].cost).toBeCloseTo(3.0, 6)
  expect(s[0].tokens).toBe(10600)
  expect(s[0].firstTs <= s[0].lastTs).toBe(true)
  expect(s[0].models).toContain('claude-opus-4-8')
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `sessions.ts`:**

```ts
import type { CostedEvent } from '../domain/types'

export interface SessionSummary {
  sessionId: string
  project: string
  agent: string
  gitBranch?: string
  cost: number
  tokens: number
  firstTs: string
  lastTs: string
  models: string[]
}

export function sessionSummaries(costed: CostedEvent[]): SessionSummary[] {
  const m = new Map<string, SessionSummary>()
  for (const e of costed) {
    const tok = e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead
    const cur = m.get(e.sessionId)
    if (!cur) {
      m.set(e.sessionId, {
        sessionId: e.sessionId, project: e.project, agent: e.agent, gitBranch: e.gitBranch,
        cost: e.cost, tokens: tok, firstTs: e.ts, lastTs: e.ts, models: [e.model],
      })
    } else {
      cur.cost += e.cost
      cur.tokens += tok
      if (e.ts < cur.firstTs) cur.firstTs = e.ts
      if (e.ts > cur.lastTs) cur.lastTs = e.ts
      if (!cur.models.includes(e.model)) cur.models.push(e.model)
    }
  }
  return [...m.values()].sort((a, b) => b.cost - a.cost)
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Add to Aggregates + buildAggregates**

In `src/aggregate/index.ts`: import `sessionSummaries`, add `sessionSummaries: ReturnType<typeof sessionSummaries>` to the `Aggregates` interface, and `sessionSummaries: sessionSummaries(costed),` in `buildAggregates`. Run full suite — the `index.test.ts` assertion set is additive-safe.

- [ ] **Step 6: Build + suite + commit**

```bash
git add src/aggregate/sessions.ts src/aggregate/sessions.test.ts src/aggregate/index.ts
git commit -m "feat(2c): sessionSummaries aggregate for drill-down"
```

---

### Task 6: Session drill-down UI

**Files:**
- Create: `src/features/drilldown/SessionListCard.tsx`, `SessionDetail.tsx`, `sessionTimelineOption.ts`
- Test: `src/features/drilldown/sessionTimelineOption.test.ts`, `SessionListCard.dom.test.tsx`
- Modify: `Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.sessionSummaries`, `eventsBySession` (rawDb), `usd`, `tokensCompact`.
- Produces: `<SessionListCard />` — top sessions by cost as clickable rows; clicking sets a selected sessionId → `<SessionDetail sessionId />` loads its events and shows a per-message cost line + summary. `buildSessionTimelineOption(events, theme)` — cumulative cost over the session's messages.

- [ ] **Step 1: timeline option test (TDD)** — `sessionTimelineOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildSessionTimelineOption } from './sessionTimelineOption'
import type { CostedEvent } from '../../domain/types'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const ev = (ts: string, cost: number): CostedEvent => ({
  sessionId: 's', project: 'p', agent: 'claude', ts, model: 'm',
  tokens: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 }, cost,
})

test('cumulative cost line over message index', () => {
  const opt: any = buildSessionTimelineOption([ev('t1', 1), ev('t2', 2)], theme)
  expect(opt.series[0].type).toBe('line')
  expect(opt.series[0].data).toEqual([1, 3]) // cumulative
  expect(opt.legend).toBeUndefined()
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `sessionTimelineOption.ts`:**

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import type { CostedEvent } from '../../domain/types'
import { categorical } from '../../viz/palette'

export function buildSessionTimelineOption(events: CostedEvent[], theme: ChartTheme): EChartsOption {
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts))
  let acc = 0
  const cum = sorted.map((e) => (acc += e.cost))
  const color = categorical(theme.theme)[0]
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: { trigger: 'axis', valueFormatter: (v) => `$${Number(v).toFixed(2)}` },
    xAxis: { type: 'category', data: sorted.map((_, i) => String(i + 1)), axisLabel: { color: theme.muted }, axisLine: { lineStyle: { color: theme.grid } }, name: '訊息序', nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` } },
    series: [{ type: 'line', step: 'end', showSymbol: false, data: cum, lineStyle: { width: 2, color }, areaStyle: { color, opacity: 0.1 } }],
  }
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: SessionDetail.tsx**

```tsx
import { useEffect, useState } from 'react'
import type { CostedEvent } from '../../domain/types'
import { eventsBySession } from '../../store/rawDb'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { usd, tokensCompact } from '../../ui/format'
import { buildSessionTimelineOption } from './sessionTimelineOption'

export function SessionDetail({ sessionId }: { sessionId: string }) {
  const [events, setEvents] = useState<CostedEvent[] | null>(null)
  const theme = useChartTheme()
  useEffect(() => {
    let cancelled = false
    eventsBySession(sessionId).then((e) => !cancelled && setEvents(e))
    return () => { cancelled = true }
  }, [sessionId])
  if (!events) return <p className="text-muted-foreground text-sm">載入中…</p>
  const cost = events.reduce((a, e) => a + e.cost, 0)
  const tok = events.reduce((a, e) => a + e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead, 0)
  return (
    <div className="flex flex-col gap-3">
      <div className="text-muted-foreground flex gap-4 text-xs">
        <span>{events.length} 則訊息</span>
        <span>成本 {usd(cost)}</span>
        <span>{tokensCompact(tok)} tokens</span>
      </div>
      <EChart option={buildSessionTimelineOption(events, theme)} style={{ height: 220 }} />
    </div>
  )
}
```

- [ ] **Step 6: SessionListCard.tsx (+ test)**

```tsx
import { useState } from 'react'
import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { usd } from '../../ui/format'
import { SessionDetail } from './SessionDetail'

export function SessionListCard() {
  const agg = useAggregates()
  const [selected, setSelected] = useState<string | null>(null)
  if (!agg) return null
  const rows = agg.sessionSummaries.slice(0, 12)
  return (
    <Card title="Session 明細" subtitle="點一列看該 session 的訊息級成本" className="lg:col-span-2">
      {rows.length === 0 ? (
        <EmptyState>尚無資料（需 JSONL）</EmptyState>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <ul className="max-h-72 divide-y overflow-auto text-sm">
            {rows.map((s) => (
              <li key={s.sessionId}>
                <button
                  onClick={() => setSelected(s.sessionId)}
                  className={`flex w-full items-center justify-between gap-2 py-2 text-left ${selected === s.sessionId ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  <span className="truncate">{s.project}<span className="opacity-50"> · {s.agent}</span></span>
                  <span className="tabular-nums">{usd(s.cost)}</span>
                </button>
              </li>
            ))}
          </ul>
          <div>{selected ? <SessionDetail sessionId={selected} /> : <EmptyState>選一個 session</EmptyState>}</div>
        </div>
      )}
    </Card>
  )
}
```

`SessionListCard.dom.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { SessionListCard } from './SessionListCard'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(() => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('lists sessions and selects one on click', () => {
  render(<SessionListCard />)
  const row = screen.getByRole('button', { name: /app/ })
  fireEvent.click(row)
  expect(screen.getByText(/則訊息|載入中/)).toBeTruthy()
})
```
Mock `EChart` in this test (`vi.mock('../../viz/EChart', () => ({ EChart: () => null }))`) to avoid canvas in the SessionDetail render.

- [ ] **Step 7: Render in Dashboard + build + commit**

Add a "Session 明細" section with `<SessionListCard />`. `pnpm build` + suite green.
```bash
git add src/features/drilldown src/features/dashboard/Dashboard.tsx
git commit -m "feat(2c): session drill-down (list + per-message timeline)"
```

---

### Task 7: Polish — dark heatmap cells + token %-normalized toggle

**Files:**
- Modify: `src/features/charts/hourHeatmapOption.ts` (drop noisy splitArea on empty cells)
- Modify: `src/features/charts/tokenCompositionOption.ts`, `TokenCompositionCard.tsx` (add a 100%-stack toggle)
- Test: update `tokenCompositionOption.test.ts`

**Interfaces:**
- `buildTokenCompositionOption(data, theme, normalized = false)` — when `normalized`, each date's 4 values are scaled to sum 100% (`stack` + `areaStyle` unchanged; yAxis becomes 0–100%).

- [ ] **Step 1: Heatmap polish** — in `hourHeatmapOption.ts`, set `xAxis.splitArea.show: false` and `yAxis.splitArea.show: false` (empty cells then read as card background, not gray bands), and keep the 1px surface `borderColor` on drawn cells. No test change (option-shape test still passes; add `expect(opt.xAxis.splitArea.show).toBe(false)` if the existing test referenced splitArea).

- [ ] **Step 2: Token normalized toggle (TDD)** — add to `tokenCompositionOption.test.ts`:

```ts
test('normalized mode scales each date to 100%', () => {
  const row = { date: 'd', input: 25, output: 25, cacheCreation: 25, cacheRead: 25 }
  const opt: any = buildTokenCompositionOption([row], { theme: 'light', ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }, true)
  const sum = opt.series.reduce((a: number, s: any) => a + s.data[0], 0)
  expect(sum).toBeCloseTo(100, 6)
  expect(opt.yAxis.max).toBe(100)
})
```

- [ ] **Step 3: Run → FAIL.**

- [ ] **Step 4: Implement normalized** — in `buildTokenCompositionOption`, add a 3rd param `normalized = false`. When true, for each date compute the row total across the 4 keys and emit `value / total * 100` (guard total 0 → 0), and set `yAxis.max = 100`, `yAxis.axisLabel.formatter = (v) => \`${v}%\``. Existing calls (2-arg) keep raw behavior.

- [ ] **Step 5: Toggle in TokenCompositionCard** — add a small `actions` button on the Card ("%" vs "量") that flips a local `normalized` state, passed into the option builder.

- [ ] **Step 6: Run → PASS; build + suite + commit**

```bash
git add src/features/charts/hourHeatmapOption.ts src/features/charts/tokenComposition* src/features/charts/TokenCompositionCard.tsx
git commit -m "feat(2c): dark heatmap cell polish + token composition 100%-stack toggle"
```

---

## Self-Review

- **Spec coverage:** date-range filter (time-series+KPI pure slice → Tasks 1-2; project+heatmap async recompute → Tasks 3-4); session drill-down (Tasks 5-6); polish (Task 7). Dimension filters → **Plan 2d** (ADR in this plan's Architecture). ✅
- **Purity:** `resolveRange`/`sliceByDate`/`sliceKpis`/`recomputeEventCards`/`sessionSummaries`/`buildSessionTimelineOption` all pure; the only `Date.now()`/`new Date()` reads are at hook edges (`useResolvedRange`, `useFilteredEventCards`, `SessionDetail`). ✅
- **Backward-compat:** `sessionSummaries` is an additive Aggregates field; `buildTokenCompositionOption`'s 3rd param defaults false — existing call sites/tests unaffected. ✅
- **Placeholder scan:** none. **Type consistency:** `{from,to}` range shape uniform; `useResolvedRange` returns `preset` + bounds; `Aggregates` extended once.

## Deferred to Plan 2d

Dimension filters (project / model / agent / branch) — requires rebuilding the daily/token/cache cards from costed events, which drops non-Claude agents; needs a UX decision (per-provenance filtering or an explicit "Claude-only" recompute mode). Table-view + texture accessibility fallback for the CVD floor-band palette. Custom date-range picker (arbitrary from/to).
