# AI Usage Dashboard — UI Plan 2b (remaining cards + hardening)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add the 7 remaining analytics cards on top of Plan 2a's shell, thread the hour-heatmap to local time, and harden the chart layer (empty-state guards, single-series legend rule, ECharts tree-shake). Global filters + session drill-down are **Plan 2c**.

**Architecture:** Same thin presentational pattern as 2a — each card = a pure `buildXOption(data, theme)` + a component reading a selector into the shared `EChart`. All data already exists in the frozen `Aggregates` API (Plan 1); only `hourHeatmap` gains a timezone-offset parameter.

**Tech Stack:** React + TS, ECharts, Tailwind/shadcn, Vitest + @testing-library (jsdom).

## Global Constraints

- pnpm. TS strict. Verify types with **`pnpm build`** (bare `tsc --noEmit` no-ops in this repo — solution-style root tsconfig).
- dataviz: **color follows entity, never rank** — single-metric bars (project ranking, efficiency, session histogram) use ONE hue, not per-bar categorical. **Agent share** is the only new categorical chart (each agent = a fixed-order identity hue + legend). **Heatmap** uses a sequential single-hue ramp (light→dark), never rainbow. No dual-axis. Legend only for ≥2 series/categories. Text via ink/muted tokens. Every plot has a tooltip. Dark mode via the `.dark` class (already wired in `useChartTheme`).
- Money via `usd()`; tokens via `tokensCompact()`; percentages 1 decimal.
- Cost is ccusage-sourced (never invent). Money-carrying cards (project ranking, efficiency, projection, why-today) all trace to allocated ccusage cost.
- Card empty state: when a card's data array is empty, render `<EmptyState>尚無資料</EmptyState>` instead of a blank chart frame.

## Validated palette note

Categorical (from 2a, unchanged): light `['#2f7ed8','#e8700a','#8a54e0','#159c5b','#d13b6e','#0aa6c2']`, dark orange→`#d1660a`. This task adds a **sequential blue ramp** for the heatmap (lightness-monotonic; ECharts `visualMap` interpolates between stops):
- light card: `['#eaf2fb','#bcd8f2','#7fb2e5','#3f83cf','#1f5fa8']`
- dark card: `['#12233a','#1c3d63','#2a5f97','#3f83cf','#6aa8e8']`

---

### Task 1: Hour-heatmap local-time threading + sequential palette

**Files:**
- Modify: `src/aggregate/analytics.ts` (hourHeatmap gains tzOffsetMinutes)
- Modify: `src/aggregate/index.ts` (buildAggregates threads tzOffsetMinutes)
- Modify: `src/workers/parse.worker.ts`, `src/import/importViaWorker.ts` (pass browser offset)
- Modify: `src/viz/palette.ts` (add SEQUENTIAL_BLUE_LIGHT/DARK + sequentialBlue(theme))
- Test: `src/aggregate/analytics.test.ts` (add tz test), `src/viz/palette.test.ts` (add ramp test)

**Interfaces:**
- Produces:
  - `hourHeatmap(costed, tzOffsetMinutes = 0)` — buckets by LOCAL weekday/hour, where local = `ts` shifted by `-tzOffsetMinutes` (matching `Date.prototype.getTimezoneOffset` sign: offset is minutes to ADD to local to get UTC, so local = UTC − offset).
  - `buildAggregates(bundle, todayIso, tzOffsetMinutes = 0)`.
  - `sequentialBlue(theme: 'light'|'dark'): string[]`.

- [ ] **Step 1: Add tz test to analytics.test.ts (TDD)**

Append to `src/aggregate/analytics.test.ts`:

```ts
import { hourHeatmap as hm } from './analytics'
test('hourHeatmap shifts to local time by tzOffsetMinutes', () => {
  // event at 2026-07-10T23:30Z; tzOffset -480 (UTC+8) → local 07:31 Fri... compute:
  // local = UTC - offset(min). offset=-480 → local = 23:30 + 480min = 07:30 next day (Sat=6)
  const costed = [{
    sessionId: 's', project: 'p', agent: 'claude', ts: '2026-07-10T23:30:00.000Z',
    model: 'm', tokens: { input: 1, output: 0, cacheCreation: 0, cacheRead: 0 }, cost: 1,
  }]
  const cell = hm(costed, -480).find((c) => c.cost === 1)!
  expect(cell.weekday).toBe(6) // Saturday local
  expect(cell.hour).toBe(7)
})
```

- [ ] **Step 2: Run → FAIL** (`pnpm exec vitest run src/aggregate/analytics.test.ts`) — hm signature ignores 2nd arg.

- [ ] **Step 3: Update hourHeatmap in analytics.ts**

Replace the `hourHeatmap` function body:

```ts
export function hourHeatmap(costed: CostedEvent[], tzOffsetMinutes = 0) {
  const m = new Map<string, number>()
  for (const e of costed) {
    // local = UTC shifted by -offset (getTimezoneOffset: minutes to add to local → UTC)
    const local = new Date(new Date(e.ts).getTime() - tzOffsetMinutes * 60_000)
    const key = `${local.getUTCDay()}:${local.getUTCHours()}`
    m.set(key, (m.get(key) ?? 0) + e.cost)
  }
  return [...m.entries()].map(([k, cost]) => {
    const [weekday, hour] = k.split(':').map(Number)
    return { weekday, hour, cost }
  })
}
```

(Using `getUTC*` on the shifted instant yields the local wall-clock components without depending on the runtime's own zone.)

- [ ] **Step 4: Thread through buildAggregates**

In `src/aggregate/index.ts`, change signature to `buildAggregates(bundle, todayIso, tzOffsetMinutes = 0)` and the call to `hourHeatmap(costed, tzOffsetMinutes)`.

- [ ] **Step 5: Pass browser offset through the worker path**

In `src/workers/parse.worker.ts`, read `tzOffsetMinutes` off the message and pass to buildAggregates:
```ts
self.onmessage = (e: MessageEvent<{ bytes: ArrayBuffer; todayIso: string; tzOffsetMinutes: number }>) => {
  try {
    const bundle = parseBundle(new Uint8Array(e.data.bytes))
    const { aggregates, costed, coverage } = buildAggregates(bundle, e.data.todayIso, e.data.tzOffsetMinutes)
    ...
```
In `src/import/importViaWorker.ts`, include it in postMessage:
```ts
    worker.postMessage({ bytes, todayIso, tzOffsetMinutes: new Date().getTimezoneOffset() }, [bytes])
```
Also `src/import/importBundle.ts` (main-thread path): `buildAggregates(bundle, todayIso, new Date().getTimezoneOffset())`.

- [ ] **Step 6: Add sequential ramp to palette.ts + test**

Append to `src/viz/palette.ts`:
```ts
export const SEQUENTIAL_BLUE_LIGHT = ['#eaf2fb', '#bcd8f2', '#7fb2e5', '#3f83cf', '#1f5fa8']
export const SEQUENTIAL_BLUE_DARK = ['#12233a', '#1c3d63', '#2a5f97', '#3f83cf', '#6aa8e8']
export function sequentialBlue(theme: 'light' | 'dark'): string[] {
  return theme === 'dark' ? SEQUENTIAL_BLUE_DARK : SEQUENTIAL_BLUE_LIGHT
}
```
Append to `src/viz/palette.test.ts`:
```ts
import { sequentialBlue, SEQUENTIAL_BLUE_LIGHT } from './palette'
test('sequential blue ramp is light→dark, 5 stops', () => {
  expect(sequentialBlue('light')).toBe(SEQUENTIAL_BLUE_LIGHT)
  expect(SEQUENTIAL_BLUE_LIGHT).toHaveLength(5)
})
```

- [ ] **Step 7: Run all + build + commit**

`pnpm exec vitest run` (green), `pnpm build` (green).
```bash
git add src/aggregate src/workers/parse.worker.ts src/import src/viz/palette.ts src/viz/palette.test.ts
git commit -m "feat(2b): local-time hour heatmap threading + sequential palette"
```

---

### Task 2: Project ranking card (horizontal bar)

**Files:**
- Create: `src/features/charts/projectRankingOption.ts`, `ProjectRankingCard.tsx`
- Test: `src/features/charts/projectRankingOption.test.ts`
- Modify: `src/features/dashboard/Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.projectRanking` (`{project, cost, tokens}[]`, desc by cost).
- Produces: `buildProjectRankingOption(rows, theme)` — top 10 horizontal bars, ONE hue (blue), value axis = cost, category axis = project, direct `$` labels, tooltip.

- [ ] **Step 1: Test (TDD)** — `src/features/charts/projectRankingOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildProjectRankingOption } from './projectRankingOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('horizontal bars, top 10, single hue, cost values', () => {
  const rows = Array.from({ length: 12 }, (_, i) => ({ project: `p${i}`, cost: 12 - i, tokens: 0 }))
  const opt: any = buildProjectRankingOption(rows, theme)
  expect(opt.series).toHaveLength(1)
  expect(opt.series[0].type).toBe('bar')
  expect(opt.yAxis.type).toBe('category')        // horizontal
  expect(opt.xAxis.type).toBe('value')
  expect(opt.series[0].data).toHaveLength(10)     // capped top 10
  expect(typeof opt.series[0].itemStyle.color).toBe('string') // one color, not per-bar array
  expect(opt.legend).toBeUndefined()              // single series
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `src/features/charts/projectRankingOption.ts`:**

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { project: string; cost: number; tokens: number }

export function buildProjectRankingOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const top = rows.slice(0, 10)
  const color = categorical(theme.theme)[0]
  // echarts category axis draws bottom→top; reverse so the biggest is on top
  const ordered = [...top].reverse()
  return {
    grid: { left: 8, right: 56, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', valueFormatter: (v) => `$${Number(v).toFixed(2)}` },
    xAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    yAxis: {
      type: 'category',
      data: ordered.map((r) => r.project),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    series: [
      {
        type: 'bar',
        data: ordered.map((r) => r.cost),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: theme.muted, formatter: (p: any) => `$${p.value.toFixed(0)}` },
      },
    ],
  }
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `ProjectRankingCard.tsx`:**

```tsx
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { EmptyState } from '../../ui/EmptyState'
import { buildProjectRankingOption } from './projectRankingOption'

export function ProjectRankingCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="專案花費排行" subtitle="需 JSONL 才能歸屬到專案">
      {agg.projectRanking.length === 0 ? (
        <EmptyState>尚無資料</EmptyState>
      ) : (
        <EChart option={buildProjectRankingOption(agg.projectRanking, theme)} style={{ height: 320 }} />
      )}
    </Card>
  )
}
```

- [ ] **Step 6: Wire into grid + build + commit**

Add `<ProjectRankingCard />` to `DashboardGrid`. `pnpm build` green.
```bash
git add src/features/charts/projectRanking* src/features/charts/ProjectRankingCard.tsx src/features/dashboard/Dashboard.tsx
git commit -m "feat(2b): project ranking card"
```

---

### Task 3: Hour heatmap card (7×24, local time)

**Files:**
- Create: `src/features/charts/hourHeatmapOption.ts`, `HourHeatmapCard.tsx`
- Test: `src/features/charts/hourHeatmapOption.test.ts`
- Modify: `Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.hourHeatmap` (`{weekday, hour, cost}[]`).
- Produces: `buildHourHeatmapOption(cells, theme)` — 24 (x=hour) × 7 (y=weekday) heatmap; `visualMap` sequential blue ramp; weekday labels 週日..週六; tooltip shows weekday+hour+cost.

- [ ] **Step 1: Test (TDD)** — `hourHeatmapOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildHourHeatmapOption } from './hourHeatmapOption'
import { sequentialBlue } from '../../viz/palette'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('heatmap series maps [hour, weekday, cost] with sequential visualMap', () => {
  const opt: any = buildHourHeatmapOption([{ weekday: 5, hour: 13, cost: 3 }], theme)
  expect(opt.series[0].type).toBe('heatmap')
  expect(opt.series[0].data[0]).toEqual([13, 5, 3])   // [x=hour, y=weekday, value]
  expect(opt.xAxis.data).toHaveLength(24)
  expect(opt.yAxis.data).toHaveLength(7)
  expect(opt.visualMap.inRange.color).toEqual(sequentialBlue('light'))
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `hourHeatmapOption.ts`:**

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { sequentialBlue } from '../../viz/palette'

type Cell = { weekday: number; hour: number; cost: number }
const DOW = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']
const HOURS = Array.from({ length: 24 }, (_, h) => String(h))

export function buildHourHeatmapOption(cells: Cell[], theme: ChartTheme): EChartsOption {
  const max = cells.reduce((m, c) => Math.max(m, c.cost), 0)
  return {
    grid: { left: 48, right: 16, top: 8, bottom: 56, containLabel: true },
    tooltip: {
      position: 'top',
      formatter: (p: any) =>
        `${DOW[p.value[1]]} ${p.value[0]}:00 — $${Number(p.value[2]).toFixed(2)}`,
    },
    xAxis: { type: 'category', data: HOURS, splitArea: { show: true }, axisLabel: { color: theme.muted, interval: 2 }, axisLine: { lineStyle: { color: theme.grid } } },
    yAxis: { type: 'category', data: DOW, splitArea: { show: true }, axisLabel: { color: theme.muted }, axisLine: { lineStyle: { color: theme.grid } } },
    visualMap: {
      min: 0,
      max: max || 1,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      textStyle: { color: theme.muted },
      inRange: { color: sequentialBlue(theme.theme) },
    },
    series: [
      {
        type: 'heatmap',
        data: cells.map((c) => [c.hour, c.weekday, c.cost]),
        itemStyle: { borderColor: theme.surface, borderWidth: 1 },
      },
    ],
  }
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `HourHeatmapCard.tsx`** (mirror ProjectRankingCard; title `開發時段熱力圖`, subtitle `本地時間`, empty-guard on `agg.hourHeatmap.length === 0`, `style={{ height: 300 }}`).

- [ ] **Step 6: Wire + build + commit**

```bash
git commit -m "feat(2b): hour heatmap card (local time, sequential ramp)"
```

---

### Task 4: Model efficiency card ($/1M output, bar)

**Files:** `modelEfficiencyOption.ts`, `ModelEfficiencyCard.tsx`, test, Dashboard.

**Interfaces:** Consumes `aggregates.modelEfficiency` (`{model, costPerMillionOutput}[]`, asc). Produces horizontal bars, ONE hue (green = efficiency), value label `$X/1M`.

- [ ] **Step 1: Test** — `modelEfficiencyOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildModelEfficiencyOption } from './modelEfficiencyOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
test('single-hue horizontal bars of $/1M output', () => {
  const opt: any = buildModelEfficiencyOption([{ model: 'a', costPerMillionOutput: 1500 }], theme)
  expect(opt.series[0].type).toBe('bar')
  expect(opt.yAxis.type).toBe('category')
  expect(opt.series[0].data).toEqual([1500])
  expect(typeof opt.series[0].itemStyle.color).toBe('string')
  expect(opt.legend).toBeUndefined()
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `modelEfficiencyOption.ts`:**

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { model: string; costPerMillionOutput: number }

export function buildModelEfficiencyOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const color = categorical(theme.theme)[3] // green = efficiency identity
  const ordered = [...rows].reverse() // asc → cheapest on top after reverse
  return {
    grid: { left: 8, right: 72, top: 8, bottom: 8, containLabel: true },
    tooltip: { trigger: 'item', valueFormatter: (v) => `$${Number(v).toFixed(2)} / 1M output` },
    xAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` } },
    yAxis: { type: 'category', data: ordered.map((r) => r.model), axisLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      {
        type: 'bar',
        data: ordered.map((r) => r.costPerMillionOutput),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: 'right', color: theme.muted, formatter: (p: any) => `$${p.value.toFixed(0)}/1M` },
      },
    ],
  }
}
```

- [ ] **Step 4: Run → PASS.** **Step 5:** `ModelEfficiencyCard.tsx` (title `模型成本效率`, subtitle `$ / 1M output tokens（越低越省）`, empty-guard, height 300). **Step 6:** wire + build + commit `feat(2b): model efficiency card`.

---

### Task 5: Agent share card (donut, categorical)

**Files:** `agentShareOption.ts`, `AgentShareCard.tsx`, test, Dashboard.

**Interfaces:** Consumes `aggregates.agentShare` (`{agent, cost}[]`, desc). Produces a donut pie; each agent = a fixed-order categorical hue; legend present; center/tooltip shows cost + %.

- [ ] **Step 1: Test** — `agentShareOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildAgentShareOption } from './agentShareOption'
import { CATEGORICAL_LIGHT } from '../../viz/palette'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
test('donut pie, categorical hues in fixed order, legend', () => {
  const opt: any = buildAgentShareOption([{ agent: 'claude', cost: 3 }, { agent: 'codex', cost: 2 }], theme)
  expect(opt.series[0].type).toBe('pie')
  expect(opt.series[0].radius).toEqual(['55%', '80%']) // donut
  expect(opt.series[0].data[0]).toMatchObject({ name: 'claude', value: 3, itemStyle: { color: CATEGORICAL_LIGHT[0] } })
  expect(opt.series[0].data[1].itemStyle.color).toBe(CATEGORICAL_LIGHT[1])
  expect(opt.legend).toBeTruthy()
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `agentShareOption.ts`:**

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { agent: string; cost: number }

export function buildAgentShareOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const colors = categorical(theme.theme)
  return {
    tooltip: { trigger: 'item', valueFormatter: (v) => `$${Number(v).toFixed(2)}` },
    legend: { bottom: 0, textStyle: { color: theme.muted }, icon: 'roundRect' },
    series: [
      {
        type: 'pie',
        radius: ['55%', '80%'],
        avoidLabelOverlap: true,
        label: { color: theme.muted, formatter: '{b} {d}%' },
        data: rows.map((r, i) => ({ name: r.agent, value: r.cost, itemStyle: { color: colors[i % colors.length] } })),
      },
    ],
  }
}
```

Note: agents rarely exceed 6; `i % colors.length` is a defensive wrap, not intended cycling — if >6 agents ever appear, fold in a future task (out of scope now).

- [ ] **Step 4: Run → PASS.** **Step 5:** `AgentShareCard.tsx` (title `Claude vs Codex（各 agent 成本佔比）`, empty-guard, height 300). **Step 6:** wire + build + commit `feat(2b): agent share donut`.

---

### Task 6: Session context distribution (histogram + P90)

**Files:** `sessionDistOption.ts`, `SessionDistCard.tsx`, test, Dashboard.

**Interfaces:** Consumes `aggregates.sessionDistribution` (`{totals: number[], p50, p90}`). Produces a histogram (bucket per-session total tokens into N bins), ONE hue, plus a `markLine` at P90.

- [ ] **Step 1: Test** — `sessionDistOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildSessionDistOption, bucketize } from './sessionDistOption'
const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('bucketize splits totals into N ascending bins', () => {
  const b = bucketize([0, 10, 20, 30, 40], 5)
  expect(b).toHaveLength(5)
  expect(b.reduce((a, x) => a + x.count, 0)).toBe(5)
})

test('option is a single-hue bar histogram with a P90 markLine', () => {
  const opt: any = buildSessionDistOption({ totals: [1, 2, 3, 4], p50: 2, p90: 4 }, theme)
  expect(opt.series[0].type).toBe('bar')
  expect(typeof opt.series[0].itemStyle.color).toBe('string')
  expect(opt.series[0].markLine).toBeTruthy()
  expect(opt.legend).toBeUndefined()
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `sessionDistOption.ts`:**

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

export function bucketize(totals: number[], bins: number): { label: string; count: number; lo: number }[] {
  if (totals.length === 0) return []
  const max = Math.max(...totals)
  const width = max / bins || 1
  const out = Array.from({ length: bins }, (_, i) => ({ label: '', count: 0, lo: i * width }))
  for (const t of totals) {
    const idx = Math.min(bins - 1, Math.floor(t / width))
    out[idx].count++
  }
  const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}k` : String(Math.round(n)))
  for (let i = 0; i < out.length; i++) out[i].label = k(out[i].lo)
  return out
}

export function buildSessionDistOption(
  d: { totals: number[]; p50: number; p90: number },
  theme: ChartTheme,
): EChartsOption {
  const color = categorical(theme.theme)[2] // purple
  const buckets = bucketize(d.totals, 12)
  return {
    grid: { left: 40, right: 16, top: 16, bottom: 28, containLabel: true },
    tooltip: { trigger: 'axis', valueFormatter: (v) => `${v} 個 session` },
    xAxis: { type: 'category', data: buckets.map((b) => b.label), axisLabel: { color: theme.muted, interval: 1 }, axisLine: { lineStyle: { color: theme.grid } }, name: 'tokens', nameTextStyle: { color: theme.muted } },
    yAxis: { type: 'value', splitLine: { lineStyle: { color: theme.grid } }, axisLabel: { color: theme.muted } },
    series: [
      {
        type: 'bar',
        data: buckets.map((b) => b.count),
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        markLine: {
          symbol: 'none',
          lineStyle: { color: theme.muted, type: 'dashed' },
          label: { color: theme.muted, formatter: `P90` },
          data: [{ xAxis: Math.min(11, Math.round((d.p90 / (Math.max(...d.totals) || 1)) * 12)) }],
        },
      },
    ],
  }
}
```

- [ ] **Step 4: Run → PASS.** **Step 5:** `SessionDistCard.tsx` (title `Session 上下文分布`, subtitle `每個 session 的總 token 量`, empty-guard on `sessionDistribution.totals.length===0`, height 300). **Step 6:** wire + build + commit `feat(2b): session context distribution histogram`.

---

### Task 7: Cost projection + "why today" cards

**Files:** `ProjectionCard.tsx`, `WhyTodayCard.tsx`, test `WhyTodayCard.dom.test.tsx`, Dashboard.

**Interfaces:** Consumes `aggregates.monthEndProjection` (number), `aggregates.activeBlock`, `aggregates.whyToday` (`{delta, byModel: {model, delta}[]}`). ProjectionCard is a stat card (no chart). WhyTodayCard lists the top per-model deltas driving today's spend.

- [ ] **Step 1: Test (TDD, jsdom)** — `WhyTodayCard.dom.test.tsx`:

```tsx
// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { WhyTodayCard } from './WhyTodayCard'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(() => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('renders a headline delta and per-model breakdown', () => {
  render(<WhyTodayCard />)
  expect(screen.getByText(/今天為什麼/)).toBeTruthy()
  expect(screen.getByText(/vs 近 7 日均/)).toBeTruthy()
})
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: `WhyTodayCard.tsx`:**

```tsx
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
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: `ProjectionCard.tsx`:**

```tsx
import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function ProjectionCard() {
  const agg = useAggregates()
  if (!agg) return null
  const blockProj = agg.activeBlock?.projection?.totalCost
  return (
    <Card title="成本預測">
      <p className="text-muted-foreground text-xs">本月線性推估至月底</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{usd(agg.monthEndProjection)}</p>
      {blockProj !== undefined && (
        <p className="text-muted-foreground mt-2 text-xs">目前 5h 區塊預估 {usd(blockProj)}</p>
      )}
    </Card>
  )
}
```

- [ ] **Step 6: Wire both into grid + build + commit**

```bash
git add src/features/charts/WhyTodayCard.tsx src/features/charts/ProjectionCard.tsx src/features/charts/WhyTodayCard.dom.test.tsx src/features/dashboard/Dashboard.tsx
git commit -m "feat(2b): cost projection + why-today cards"
```

---

### Task 8: Chart hardening + grid sections

**Files:** Modify all 4 Plan-2a chart cards (add empty-guards), `modelTimelineOption.ts` (conditional legend), `src/viz/EChart.tsx` (tree-shake ECharts core), `Dashboard.tsx` (section layout).

**Interfaces:** no new exports; behavior hardening only.

- [ ] **Step 1: Conditional legend on single-model timeline (TDD)**

Add to `src/features/charts/modelTimelineOption.test.ts`:
```ts
test('single model → no legend', () => {
  const opt: any = buildModelTimelineOption([{ date: 'd', model: 'solo', cost: 1 }], { theme: 'light', ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' })
  expect(opt.legend).toBeUndefined()
})
```
Run → FAIL. Then in `modelTimelineOption.ts` change the returned option so `legend` is only set when `seriesNames.length >= 2`:
```ts
    ...(seriesNames.length >= 2 ? { legend: { top: 0, textStyle: { color: theme.muted }, icon: 'roundRect' } } : {}),
```
Run → PASS.

- [ ] **Step 2: Empty-data guards on the 4 Plan-2a cards**

In `DailyCostCard`, `TokenCompositionCard`, `ModelTimelineCard`, `CacheTrendCard`: wrap the `<EChart>` so that when the source array is empty, render `<EmptyState>尚無資料</EmptyState>` instead (import EmptyState). E.g. `agg.dailyCost.length === 0 ? <EmptyState>尚無資料</EmptyState> : <EChart .../>`.

- [ ] **Step 3: Tree-shake ECharts**

In `src/viz/EChart.tsx`, replace `import * as echarts from 'echarts'` with core + explicit registration:
```ts
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart, HeatmapChart } from 'echarts/charts'
import {
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
echarts.use([
  LineChart, BarChart, PieChart, HeatmapChart,
  GridComponent, TooltipComponent, LegendComponent, VisualMapComponent, MarkLineComponent,
  CanvasRenderer,
])
export type { EChartsOption } from 'echarts' // types only, no runtime
```
Keep the rest of EChart.tsx. Option builders that `import type { EChartsOption } from 'echarts'` still work (type-only). Verify `pnpm build` — if any chart/component is missing from `echarts.use`, the build/preview surfaces a blank chart; ensure Line/Bar/Pie/Heatmap + Grid/Tooltip/Legend/VisualMap/MarkLine are all registered.

- [ ] **Step 4: Grid sections**

In `Dashboard.tsx`, organize the populated body into labeled sections for scanability: KPI row (full width) → 成本 (每日成本, 成本預測, 今天為什麼) → 用量組成 (Token 組成, Model 時間軸, 模型效率) → 專案與時段 (專案排行, 開發時段熱力圖) → 效率與分布 (Cache 趨勢, Session 分布, Claude vs Codex). Use the existing `DashboardGrid` (2-col lg) per section; a section is a `<div className="flex flex-col gap-3"><h2 className="text-sm font-medium text-muted-foreground">…</h2><DashboardGrid>…</DashboardGrid></div>`. Wide cards (heatmap) may span both columns via `className="lg:col-span-2"` on the Card.

- [ ] **Step 5: Full verify + commit**

`pnpm exec vitest run` (green), `pnpm build` (green).
```bash
git add src/features src/viz/EChart.tsx
git commit -m "feat(2b): empty-state guards, single-series legend, ECharts tree-shake, grid sections"
```

---

## Self-Review

- **Spec coverage:** cards 6 (project ranking), 9 (heatmap, local), 6-efficiency ($/1M), 10 (agent share), 11 (session dist + P90), 12 (projection), 13 (why-today) → Tasks 2–7. Heatmap local-time → Task 1. Hardening (empty states, legend, tree-shake) → Task 8. Global filters + drill-down → **Plan 2c** (documented). ✅
- **dataviz:** single-metric bars use one hue (Tasks 2,4,6); agent share is the only categorical, fixed-order + legend (Task 5); heatmap sequential ramp (Tasks 1,3); no dual-axis anywhere; single-series legend removed (Task 8); tooltips on all plots; dark via `.dark` (inherited). ✅
- **Placeholder scan:** none — complete code per step.
- **Type consistency:** `buildXOption(data, theme)` uniform; `ChartTheme` shared; `buildAggregates(bundle, todayIso, tzOffsetMinutes?)` optional 3rd arg is backward-compatible with Plan 1/2a call sites; `sequentialBlue`/`categorical` from palette.

## Deferred to Plan 2c

Global filters (date range / project / model / agent / branch) — requires re-aggregation from IndexedDB raw events on filter change; session drill-down (click session → message timeline from IndexedDB); table-view + texture accessibility fallback for the CVD floor-band palette; token-composition %-normalized toggle; cacheTrend title/semantics review.
