# AI Usage Dashboard — UI Plan 2a (shell + core charts)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Turn the frozen `Aggregates` data layer (Plan 1) into a real dashboard: a proper import panel, a responsive card grid, the KPI row, and the 4 core time-series charts — so the app shows something meaningful end-to-end. Remaining cards, global filters, and drill-down are Plan 2b.

**Architecture:** Thin presentational layer over Plan 1. A single `EChart` wrapper owns all ECharts lifecycle; every chart is a pure `buildOption(data, theme)` function + a tiny component that reads a selector and feeds the wrapper. State comes only from `useDataStore` (Plan 1). No new data logic.

**Tech Stack:** React + TS, ECharts (core, tree-shaken), Tailwind v4 + shadcn/@efferd, zustand (existing store), Vitest + @testing-library/react (jsdom).

## Global Constraints

- Package manager **pnpm**. TS strict.
- **Charts obey the dataviz skill.** No dual-axis (one y-scale per chart); categorical hues assigned in **fixed order, never cycled**; text uses ink tokens (`foreground`/`muted-foreground`), never a series color; legend present for ≥2 series with selective direct labels; recessive grid/axes; every plot ships a hover tooltip.
- **Validated categorical palette (do not change without re-running the dataviz validator):**
  - Light surface: `['#2f7ed8','#e8700a','#8a54e0','#159c5b','#d13b6e','#0aa6c2']`
  - Dark surface: `['#2f7ed8','#d1660a','#8a54e0','#159c5b','#d13b6e','#0aa6c2']`
  - Fixed identity order = blue, orange, purple, green, magenta, cyan. CVD worst-adjacent ΔE 8.7 (floor band) → legal only because we ALSO ship legend + direct labels + a 2px surface gap between stacked/adjacent fills. Keep those.
- **Token-composition semantic mapping (fixed):** input→blue, output→orange, cacheCreation→purple, cacheRead→cyan.
- Theme is **selected, not flipped**: light vs dark chosen by `prefers-color-scheme` and the `data-theme` attribute the @efferd shell stamps on `:root`; charts pick the matching validated set.
- Currency `$1,234.56`; tokens compact (`1.2M`, `3.4k`); percentages 1 decimal.
- All money in the UI traces to ccusage (Plan 1 constraint); never invent cost.
- Component files are presentational — no data transforms beyond reading a selector and shaping it for ECharts.

---

### Task 1: ECharts wrapper + validated palette module

**Files:**
- Create: `src/viz/palette.ts`
- Create: `src/viz/theme.ts`
- Create: `src/viz/EChart.tsx`
- Test: `src/viz/palette.test.ts`
- Modify: `package.json` (add echarts)

**Interfaces:**
- Consumes: nothing from Plan 1 yet.
- Produces:
  - `CATEGORICAL_LIGHT: string[]`, `CATEGORICAL_DARK: string[]`, `TOKEN_COLORS: { input; output; cacheCreation; cacheRead }` (indices into the fixed order).
  - `categorical(theme: 'light'|'dark'): string[]`
  - `useChartTheme(): { theme: 'light'|'dark'; ink: string; muted: string; grid: string; surface: string }` — reads CSS custom properties + prefers-color-scheme, re-renders on change.
  - `<EChart option={EChartsOption} className? style? />` — inits an ECharts instance, sets option, disposes on unmount, resizes via ResizeObserver.

- [ ] **Step 1: Install ECharts**

```bash
pnpm add echarts
```

- [ ] **Step 2: Write the palette test (TDD)**

Create `src/viz/palette.test.ts`:

```ts
import { expect, test } from 'vitest'
import { CATEGORICAL_LIGHT, CATEGORICAL_DARK, TOKEN_COLORS, categorical } from './palette'

test('fixed 6-hue order, light + dark', () => {
  expect(CATEGORICAL_LIGHT).toEqual(['#2f7ed8','#e8700a','#8a54e0','#159c5b','#d13b6e','#0aa6c2'])
  expect(CATEGORICAL_DARK[1]).toBe('#d1660a') // orange darkened for dark band
  expect(CATEGORICAL_LIGHT).toHaveLength(6)
})

test('categorical(theme) picks the matching set', () => {
  expect(categorical('light')).toBe(CATEGORICAL_LIGHT)
  expect(categorical('dark')).toBe(CATEGORICAL_DARK)
})

test('token colors map to fixed semantic hues', () => {
  expect(TOKEN_COLORS.input).toBe(CATEGORICAL_LIGHT[0])       // blue
  expect(TOKEN_COLORS.output).toBe(CATEGORICAL_LIGHT[1])      // orange
  expect(TOKEN_COLORS.cacheCreation).toBe(CATEGORICAL_LIGHT[2]) // purple
  expect(TOKEN_COLORS.cacheRead).toBe(CATEGORICAL_LIGHT[5])   // cyan
})
```

- [ ] **Step 3: Run test → FAIL**

Run: `pnpm exec vitest run src/viz/palette.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write palette.ts**

Create `src/viz/palette.ts`:

```ts
// Categorical palette — validated with the dataviz skill's validate_palette.js
// (all checks pass light + dark; CVD worst-adjacent ΔE 8.7 = floor band, legal
// because charts also carry legend + direct labels + 2px segment gaps).
// Fixed identity order: blue, orange, purple, green, magenta, cyan. Never cycle.
export const CATEGORICAL_LIGHT = ['#2f7ed8', '#e8700a', '#8a54e0', '#159c5b', '#d13b6e', '#0aa6c2']
export const CATEGORICAL_DARK = ['#2f7ed8', '#d1660a', '#8a54e0', '#159c5b', '#d13b6e', '#0aa6c2']

export function categorical(theme: 'light' | 'dark'): string[] {
  return theme === 'dark' ? CATEGORICAL_DARK : CATEGORICAL_LIGHT
}

// Semantic mapping for the token-composition stack (indices into the fixed order).
export const TOKEN_COLORS = {
  input: CATEGORICAL_LIGHT[0],
  output: CATEGORICAL_LIGHT[1],
  cacheCreation: CATEGORICAL_LIGHT[2],
  cacheRead: CATEGORICAL_LIGHT[5],
}
```

- [ ] **Step 5: Run test → PASS**

Run: `pnpm exec vitest run src/viz/palette.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Write theme.ts**

Create `src/viz/theme.ts`:

```ts
import { useEffect, useState } from 'react'

export interface ChartTheme {
  theme: 'light' | 'dark'
  ink: string
  muted: string
  grid: string
  surface: string
}

function readTheme(): ChartTheme {
  const root = document.documentElement
  const attr = root.getAttribute('data-theme')
  const dark =
    attr === 'dark' ||
    (attr !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  const css = getComputedStyle(root)
  const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return {
    theme: dark ? 'dark' : 'light',
    ink: v('--foreground', dark ? '#e5e5e5' : '#171717'),
    muted: v('--muted-foreground', dark ? '#a3a3a3' : '#6b7280'),
    grid: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    surface: v('--card', dark ? '#1a1a1a' : '#ffffff'),
  }
}

export function useChartTheme(): ChartTheme {
  const [t, setT] = useState<ChartTheme>(readTheme)
  useEffect(() => {
    const update = () => setT(readTheme())
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', update)
    const obs = new MutationObserver(update)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => {
      mq.removeEventListener('change', update)
      obs.disconnect()
    }
  }, [])
  return t
}
```

- [ ] **Step 7: Write EChart.tsx**

Create `src/viz/EChart.tsx`:

```tsx
import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'

export function EChart({
  option,
  className,
  style,
}: {
  option: echarts.EChartsOption
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!ref.current) return
    chart.current = echarts.init(ref.current)
    const ro = new ResizeObserver(() => chart.current?.resize())
    ro.observe(ref.current)
    return () => {
      ro.disconnect()
      chart.current?.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    chart.current?.setOption(option, true)
  }, [option])

  return <div ref={ref} className={className} style={{ width: '100%', height: 280, ...style }} />
}
```

- [ ] **Step 8: Typecheck + commit**

Run: `pnpm exec tsc --noEmit` → clean.

```bash
git add src/viz package.json pnpm-lock.yaml
git commit -m "feat(viz): ECharts wrapper + validated categorical palette + theme hook"
```

---

### Task 2: Format helpers, selector hook, Card, EmptyState, test env

**Files:**
- Create: `src/ui/format.ts`
- Create: `src/ui/selectors.ts`
- Create: `src/ui/Card.tsx`
- Create: `src/ui/EmptyState.tsx`
- Test: `src/ui/format.test.ts`
- Modify: `vitest.config.ts` (jsdom env glob for `*.tsx` tests), `package.json` (testing-library)

**Interfaces:**
- Consumes: `useDataStore` (Plan 1), `Aggregates`.
- Produces:
  - `usd(n)`, `tokensCompact(n)`, `pct(n, digits?)`, `deltaLabel(pct)` → `{ text; dir: 'up'|'down'|'flat' }`.
  - `useAggregates(): Aggregates | null`, `useHasData(): boolean`, `useCoverage()`.
  - `<Card title? subtitle? actions? children />`, `<EmptyState />`.

- [ ] **Step 1: Install testing-library**

```bash
pnpm add -D @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Write format test (TDD)**

Create `src/ui/format.test.ts`:

```ts
import { expect, test } from 'vitest'
import { usd, tokensCompact, pct, deltaLabel } from './format'

test('usd formats with thousands + 2 decimals', () => {
  expect(usd(1234.5)).toBe('$1,234.50')
  expect(usd(0)).toBe('$0.00')
})

test('tokensCompact abbreviates', () => {
  expect(tokensCompact(1_200_000)).toBe('1.2M')
  expect(tokensCompact(3400)).toBe('3.4k')
  expect(tokensCompact(500)).toBe('500')
})

test('pct with 1 decimal default', () => {
  expect(pct(0.1234)).toBe('12.3%')
})

test('deltaLabel gives direction', () => {
  expect(deltaLabel(12)).toEqual({ text: '+12.0%', dir: 'up' })
  expect(deltaLabel(-5)).toEqual({ text: '-5.0%', dir: 'down' })
  expect(deltaLabel(0)).toEqual({ text: '0.0%', dir: 'flat' })
})
```

- [ ] **Step 3: Run → FAIL**

Run: `pnpm exec vitest run src/ui/format.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write format.ts**

Create `src/ui/format.ts`:

```ts
export function usd(n: number): string {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
}

export function tokensCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function pct(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function deltaLabel(deltaPct: number): { text: string; dir: 'up' | 'down' | 'flat' } {
  const dir = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat'
  const sign = deltaPct > 0 ? '+' : ''
  return { text: `${sign}${deltaPct.toFixed(1)}%`, dir }
}
```

- [ ] **Step 5: Run → PASS**

Run: `pnpm exec vitest run src/ui/format.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Write selectors.ts**

Create `src/ui/selectors.ts`:

```ts
import { useDataStore } from '../store/useDataStore'
import type { Aggregates, Coverage } from '../domain/types'

export function useAggregates(): Aggregates | null {
  return useDataStore((s) => s.aggregates)
}
export function useCoverage(): Coverage | null {
  return useDataStore((s) => s.coverage)
}
export function useHasData(): boolean {
  return useDataStore((s) => s.aggregates !== null)
}
```

Note: `Aggregates` is exported from `src/aggregate/index.ts`; import from there if not re-exported by `domain/types`. Use `import type { Aggregates } from '../aggregate'` and `import type { Coverage } from '../domain/types'`.

- [ ] **Step 7: Write Card.tsx + EmptyState.tsx**

Create `src/ui/Card.tsx`:

```tsx
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
```

Create `src/ui/EmptyState.tsx`:

```tsx
export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex min-h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-center text-sm">
      {children}
    </div>
  )
}
```

- [ ] **Step 8: jsdom env for tsx tests**

Edit `vitest.config.ts` — keep `environment: 'node'` as default, add per-file jsdom via `environmentMatchGlobs: [['src/**/*.tsx.test.*', 'jsdom'], ['**/*.dom.test.*', 'jsdom']]`. Component tests below use the `// @vitest-environment jsdom` docblock (already the project pattern from Plan 1 Task 15), so this glob is a convenience only; if `environmentMatchGlobs` is unavailable in this vitest version, rely solely on the docblock and skip this edit.

- [ ] **Step 9: Typecheck + commit**

Run: `pnpm exec tsc --noEmit` → clean.

```bash
git add src/ui package.json pnpm-lock.yaml vitest.config.ts
git commit -m "feat(ui): format helpers, store selectors, Card + EmptyState"
```

---

### Task 3: ImportPanel (replaces DebugImport)

**Files:**
- Create: `src/features/import/ImportPanel.tsx`
- Create: `public/build-bundle.mjs` (copy of scripts/build-bundle.mjs, served for download)
- Test: `src/features/import/ImportPanel.dom.test.tsx`
- Delete: `src/components/DebugImport.tsx`

**Interfaces:**
- Consumes: `importViaWorker` (Plan 1), `EXPORT_COMMAND`/`EXPORT_HINT` (Plan 1), `useCoverage`.
- Produces: `<ImportPanel />` — drag-drop + file picker for `.gz`, a copy-command block with a download link for `build-bundle.mjs`, inline error, and (after import) a coverage line + `generatedAt`.

- [ ] **Step 1: Copy generator into public/ for download**

```bash
cp scripts/build-bundle.mjs public/build-bundle.mjs
```

- [ ] **Step 2: Write component test (TDD, jsdom)**

Create `src/features/import/ImportPanel.dom.test.tsx`:

```tsx
// @vitest-environment jsdom
import { expect, test, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportPanel } from './ImportPanel'
import { useDataStore } from '../../store/useDataStore'

vi.mock('../../import/importViaWorker', () => ({
  importViaWorker: vi.fn().mockResolvedValue({ totalSessions: 2, matchedSessions: 2, totalCost: 3, matchedCost: 3 }),
}))

beforeEach(() => useDataStore.getState().reset())

test('shows the copy-command block and a download link', () => {
  render(<ImportPanel />)
  expect(screen.getByText(/build-bundle\.mjs/)).toBeTruthy()
  expect(screen.getByRole('link', { name: /下載/ })).toBeTruthy()
})

test('rejects a non-gz file with an inline error', async () => {
  render(<ImportPanel />)
  const input = screen.getByLabelText(/上傳|bundle/i) as HTMLInputElement
  const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
  fireEvent.change(input, { target: { files: [file] } })
  expect(await screen.findByText(/\.gz/)).toBeTruthy()
})
```

- [ ] **Step 3: Run → FAIL**

Run: `pnpm exec vitest run src/features/import/ImportPanel.dom.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Write ImportPanel.tsx**

Create `src/features/import/ImportPanel.tsx`:

```tsx
import { useState } from 'react'
import { importViaWorker } from '../../import/importViaWorker'
import { EXPORT_COMMAND, EXPORT_HINT } from '../../export/exportCommand'

export function ImportPanel() {
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handle(file: File) {
    setErr(null)
    if (!file.name.endsWith('.gz')) {
      setErr('請上傳一鍵指令產生的 .gz bundle 檔')
      return
    }
    setBusy(true)
    try {
      await importViaWorker(file, new Date().toISOString().slice(0, 10))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="bg-muted/40 rounded-lg border p-4 text-sm">
        <p className="mb-2 font-medium">第一步：在終端機產生 bundle</p>
        <ol className="text-muted-foreground mb-3 list-decimal space-y-1 pl-5">
          <li>
            <a className="text-primary underline" href="/build-bundle.mjs" download>
              下載 build-bundle.mjs
            </a>
          </li>
          <li>執行下面指令</li>
        </ol>
        <pre className="bg-background overflow-x-auto rounded border p-2 font-mono text-xs">
          {EXPORT_COMMAND}
        </pre>
        <p className="text-muted-foreground mt-2 text-xs">{EXPORT_HINT}</p>
      </div>

      <label
        className="hover:bg-muted/30 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) handle(f)
        }}
      >
        <span className="font-medium">第二步：拖拉或選擇 bundle 檔</span>
        <span className="text-muted-foreground text-xs">
          {busy ? '解析中…' : '~/cc-usage-bundle.json.gz'}
        </span>
        <input
          type="file"
          accept=".gz"
          className="sr-only"
          aria-label="上傳 bundle"
          onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
        />
      </label>

      {err && <p className="text-destructive text-sm">{err}</p>}
    </div>
  )
}
```

- [ ] **Step 5: Run → PASS; delete DebugImport**

Run: `pnpm exec vitest run src/features/import/ImportPanel.dom.test.tsx`
Expected: PASS, 2 tests.

```bash
git rm src/components/DebugImport.tsx
```
(App wiring is updated in Task 4.)

- [ ] **Step 6: Commit**

```bash
git add src/features/import public/build-bundle.mjs
git commit -m "feat(import): ImportPanel with command block + download + dropzone"
```

---

### Task 4: Dashboard shell — empty vs populated, wired into App

**Files:**
- Create: `src/features/dashboard/Dashboard.tsx`
- Create: `src/features/dashboard/DashboardGrid.tsx`
- Modify: `src/App.tsx`
- Test: `src/features/dashboard/Dashboard.dom.test.tsx`

**Interfaces:**
- Consumes: `useHasData`, `ImportPanel`, `useCoverage`.
- Produces: `<Dashboard />` — no data → hero `ImportPanel`; has data → a header row (coverage + generatedAt + "重新匯入") over `<DashboardGrid>` (a responsive CSS-grid that lays out the KPI row + chart cards added in later tasks). For Task 4 the grid renders just the KPI row placeholder slot; charts slot in Tasks 5–9.

- [ ] **Step 1: Write test (TDD, jsdom)**

Create `src/features/dashboard/Dashboard.dom.test.tsx`:

```tsx
// @vitest-environment jsdom
import { expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(() => useDataStore.getState().reset())

test('no data → shows import panel', () => {
  render(<Dashboard />)
  expect(screen.getByText(/build-bundle\.mjs/)).toBeTruthy()
})

test('with data → shows dashboard grid, not the import hero', () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: '2026-07-11T00:00:00Z' })
  render(<Dashboard />)
  expect(screen.getByTestId('dashboard-grid')).toBeTruthy()
})
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm exec vitest run src/features/dashboard/Dashboard.dom.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write DashboardGrid.tsx**

Create `src/features/dashboard/DashboardGrid.tsx`:

```tsx
export function DashboardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div data-testid="dashboard-grid" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {children}
    </div>
  )
}
```

- [ ] **Step 4: Write Dashboard.tsx**

Create `src/features/dashboard/Dashboard.tsx`:

```tsx
import { useDataStore } from '../../store/useDataStore'
import { useHasData } from '../../ui/selectors'
import { ImportPanel } from '../import/ImportPanel'
import { DashboardGrid } from './DashboardGrid'

export function Dashboard() {
  const hasData = useHasData()
  const coverage = useDataStore((s) => s.coverage)
  const generatedAt = useDataStore((s) => s.generatedAt)
  const reset = useDataStore((s) => s.reset)

  if (!hasData) {
    return (
      <div className="py-8">
        <ImportPanel />
      </div>
    )
  }

  const covPct = coverage ? Math.round((coverage.matchedCost / (coverage.totalCost || 1)) * 100) : 0

  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>
          成本歸屬涵蓋率 {covPct}%
          {generatedAt && ` · 匯出於 ${new Date(generatedAt).toLocaleString()}`}
        </span>
        <button className="hover:text-foreground underline" onClick={reset}>
          重新匯入
        </button>
      </div>
      <DashboardGrid>{/* KPI row + charts slotted in Tasks 5–9 */}</DashboardGrid>
    </div>
  )
}
```

- [ ] **Step 5: Wire into App.tsx**

Edit `src/App.tsx` — replace `<DebugImport />` with `<Dashboard />` (keep AppShell + TooltipProvider):

```tsx
import { AppShell } from "@/components/app-shell";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Dashboard } from "@/features/dashboard/Dashboard";

export default function App() {
  return (
    <TooltipProvider>
      <AppShell>
        <Dashboard />
      </AppShell>
    </TooltipProvider>
  );
}
```

- [ ] **Step 6: Run test + build + PASS**

Run: `pnpm exec vitest run src/features/dashboard/Dashboard.dom.test.tsx` → PASS (2).
Run: `pnpm build` → green.

- [ ] **Step 7: Commit**

```bash
git add src/features/dashboard src/App.tsx
git commit -m "feat(dashboard): empty/populated shell wired into AppShell"
```

---

### Task 5: KPI row — stats + live 5h block

**Files:**
- Create: `src/features/kpi/KpiRow.tsx`
- Create: `src/features/kpi/LiveBlock.tsx`
- Modify: `src/features/dashboard/Dashboard.tsx` (render KpiRow)
- Test: `src/features/kpi/KpiRow.dom.test.tsx`

**Interfaces:**
- Consumes: `useAggregates` → `aggregates.kpis` (`totalCost, avgPerDay, burnRatePerHour, deltaPct`), `aggregates.activeBlock`, `aggregates.monthEndProjection`.
- Produces: `<KpiRow />` (3 stat tiles + optional LiveBlock), `<LiveBlock block />`.

- [ ] **Step 1: Write test (TDD, jsdom)**

Create `src/features/kpi/KpiRow.dom.test.tsx`:

```tsx
// @vitest-environment jsdom
import { expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiRow } from './KpiRow'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(() => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('renders total cost, avg/day, burn labels + values', () => {
  render(<KpiRow />)
  expect(screen.getByText(/總花費/)).toBeTruthy()
  expect(screen.getByText('$3.00')).toBeTruthy() // SAMPLE totalCost
  expect(screen.getByText(/日均/)).toBeTruthy()
  expect(screen.getByText(/Burn/)).toBeTruthy()
})
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm exec vitest run src/features/kpi/KpiRow.dom.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write LiveBlock.tsx**

Create `src/features/kpi/LiveBlock.tsx`:

```tsx
import type { CcusageBlock } from '../../domain/types'
import { Card } from '../../ui/Card'
import { usd } from '../../ui/format'

export function LiveBlock({ block }: { block: CcusageBlock }) {
  const start = new Date(block.startTime).getTime()
  const end = new Date(block.endTime).getTime()
  const now = Date.now()
  const progress = Math.min(1, Math.max(0, (now - start) / (end - start)))
  const remainMin = Math.max(0, Math.round((end - now) / 60000))

  return (
    <Card title="目前 5 小時計費區塊" subtitle={`剩餘約 ${remainMin} 分鐘`}>
      <div className="bg-muted h-2 overflow-hidden rounded-full">
        <div className="bg-primary h-full rounded-full" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="text-muted-foreground mt-2 flex justify-between text-xs">
        <span>已花 {usd(block.costUSD)}</span>
        {block.projection && <span>預估總額 {usd(block.projection.totalCost)}</span>}
      </div>
    </Card>
  )
}
```

Note: LiveBlock is the one component allowed `Date.now()` — it renders a live clock, not a pure aggregate.

- [ ] **Step 4: Write KpiRow.tsx**

Create `src/features/kpi/KpiRow.tsx`:

```tsx
import { useAggregates } from '../../ui/selectors'
import { Card } from '../../ui/Card'
import { usd, deltaLabel } from '../../ui/format'
import { LiveBlock } from './LiveBlock'

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const d = delta === undefined ? null : deltaLabel(delta)
  const color = d?.dir === 'up' ? 'text-emerald-600' : d?.dir === 'down' ? 'text-rose-600' : 'text-muted-foreground'
  return (
    <Card>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      {d && <p className={`mt-1 text-xs ${color}`}>{d.text} vs 前一日</p>}
    </Card>
  )
}

export function KpiRow() {
  const agg = useAggregates()
  if (!agg) return null
  const { kpis, activeBlock } = agg
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label="總花費" value={usd(kpis.totalCost)} delta={kpis.deltaPct} />
      <Stat label="日均花費" value={usd(kpis.avgPerDay)} />
      <Stat label="Burn rate（每小時）" value={usd(kpis.burnRatePerHour)} />
      {activeBlock ? (
        <LiveBlock block={activeBlock} />
      ) : (
        <Stat label="月底預估" value={usd(agg.monthEndProjection)} />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Render in Dashboard**

Edit `src/features/dashboard/Dashboard.tsx` — inside the populated branch, render `<KpiRow />` above `<DashboardGrid>`:

```tsx
import { KpiRow } from '../kpi/KpiRow'
// ...
      <KpiRow />
      <DashboardGrid>{/* charts Tasks 6–9 */}</DashboardGrid>
```

- [ ] **Step 6: Run test → PASS; build**

Run: `pnpm exec vitest run src/features/kpi/KpiRow.dom.test.tsx` → PASS.
Run: `pnpm build` → green.

- [ ] **Step 7: Commit**

```bash
git add src/features/kpi src/features/dashboard/Dashboard.tsx
git commit -m "feat(kpi): KPI stat row + live 5h block card"
```

---

### Task 6: Daily cost area chart

**Files:**
- Create: `src/features/charts/dailyCostOption.ts`
- Create: `src/features/charts/DailyCostCard.tsx`
- Test: `src/features/charts/dailyCostOption.test.ts`
- Modify: `src/features/dashboard/Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.dailyCost` (`{date, cost}[]`), `useChartTheme`, `EChart`, `Card`.
- Produces: `buildDailyCostOption(data, theme): EChartsOption`, `<DailyCostCard />`.

- [ ] **Step 1: Write option test (TDD)**

Create `src/features/charts/dailyCostOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildDailyCostOption } from './dailyCostOption'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('maps dates to x and cost to a single area series', () => {
  const opt: any = buildDailyCostOption([{ date: '2026-07-09', cost: 10 }, { date: '2026-07-10', cost: 15 }], theme)
  expect(opt.xAxis.data).toEqual(['2026-07-09', '2026-07-10'])
  expect(opt.series).toHaveLength(1)
  expect(opt.series[0].data).toEqual([10, 15])
  expect(opt.series[0].type).toBe('line')
  expect(opt.series[0].areaStyle).toBeTruthy()
})

test('single series → no legend, tooltip present', () => {
  const opt: any = buildDailyCostOption([{ date: 'd', cost: 1 }], theme)
  expect(opt.legend).toBeUndefined()
  expect(opt.tooltip.trigger).toBe('axis')
})
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm exec vitest run src/features/charts/dailyCostOption.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write dailyCostOption.ts**

Create `src/features/charts/dailyCostOption.ts`:

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

export function buildDailyCostOption(
  data: { date: string; cost: number }[],
  theme: ChartTheme,
): EChartsOption {
  const color = categorical(theme.theme)[0] // blue, fixed identity
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `$${Number(v).toFixed(2)}`,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    series: [
      {
        name: '每日成本',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data.map((d) => d.cost),
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.12 },
      },
    ],
  }
}
```

- [ ] **Step 4: Run → PASS**

Run: `pnpm exec vitest run src/features/charts/dailyCostOption.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write DailyCostCard.tsx**

Create `src/features/charts/DailyCostCard.tsx`:

```tsx
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { buildDailyCostOption } from './dailyCostOption'

export function DailyCostCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="每日成本">
      <EChart option={buildDailyCostOption(agg.dailyCost, theme)} />
    </Card>
  )
}
```

- [ ] **Step 6: Render in DashboardGrid + build**

Edit `Dashboard.tsx`: add `<DailyCostCard />` inside `<DashboardGrid>`.
Run: `pnpm build` → green.

- [ ] **Step 7: Commit**

```bash
git add src/features/charts/dailyCostOption.ts src/features/charts/dailyCostOption.test.ts src/features/charts/DailyCostCard.tsx src/features/dashboard/Dashboard.tsx
git commit -m "feat(charts): daily cost area chart"
```

---

### Task 7: Token composition stacked area

**Files:**
- Create: `src/features/charts/tokenCompositionOption.ts`
- Create: `src/features/charts/TokenCompositionCard.tsx`
- Test: `src/features/charts/tokenCompositionOption.test.ts`
- Modify: `src/features/dashboard/Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.tokenComposition` (`{date, input, output, cacheCreation, cacheRead}[]`), `TOKEN_COLORS`.
- Produces: `buildTokenCompositionOption(data, theme)`, `<TokenCompositionCard />`.

- [ ] **Step 1: Write option test (TDD)**

Create `src/features/charts/tokenCompositionOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildTokenCompositionOption } from './tokenCompositionOption'
import { TOKEN_COLORS } from '../../viz/palette'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }
const row = { date: '2026-07-10', input: 100, output: 2000, cacheCreation: 500, cacheRead: 8000 }

test('four stacked series in fixed semantic order + colors', () => {
  const opt: any = buildTokenCompositionOption([row], theme)
  expect(opt.series.map((s: any) => s.name)).toEqual(['Input', 'Output', 'Cache 建立', 'Cache 讀取'])
  expect(opt.series.every((s: any) => s.stack === 'tok')).toBe(true)
  expect(opt.series[0].itemStyle.color).toBe(TOKEN_COLORS.input)
  expect(opt.series[3].itemStyle.color).toBe(TOKEN_COLORS.cacheRead)
})

test('has legend (>=2 series) + 2px surface gap between fills', () => {
  const opt: any = buildTokenCompositionOption([row], theme)
  expect(opt.legend).toBeTruthy()
  expect(opt.series[0].areaStyle).toBeTruthy()
  // 2px gap between stacked fills via a surface-colored border
  expect(opt.series[0].itemStyle.borderColor).toBe(theme.surface)
  expect(opt.series[0].itemStyle.borderWidth).toBe(2)
})
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm exec vitest run src/features/charts/tokenCompositionOption.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write tokenCompositionOption.ts**

Create `src/features/charts/tokenCompositionOption.ts`:

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { TOKEN_COLORS } from '../../viz/palette'

type Row = { date: string; input: number; output: number; cacheCreation: number; cacheRead: number }

const SERIES: { name: string; key: keyof Omit<Row, 'date'>; color: string }[] = [
  { name: 'Input', key: 'input', color: TOKEN_COLORS.input },
  { name: 'Output', key: 'output', color: TOKEN_COLORS.output },
  { name: 'Cache 建立', key: 'cacheCreation', color: TOKEN_COLORS.cacheCreation },
  { name: 'Cache 讀取', key: 'cacheRead', color: TOKEN_COLORS.cacheRead },
]

export function buildTokenCompositionOption(data: Row[], theme: ChartTheme): EChartsOption {
  return {
    grid: { left: 56, right: 16, top: 32, bottom: 28 },
    legend: { top: 0, textStyle: { color: theme.muted }, icon: 'roundRect' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    series: SERIES.map((s) => ({
      name: s.name,
      type: 'line',
      stack: 'tok',
      smooth: false,
      showSymbol: false,
      areaStyle: { color: s.color, opacity: 0.85 },
      lineStyle: { width: 0 },
      // 2px surface-colored ring separates stacked fills (dataviz spacer rule)
      itemStyle: { color: s.color, borderColor: theme.surface, borderWidth: 2 },
      data: data.map((d) => d[s.key]),
    })),
  }
}
```

- [ ] **Step 4: Run → PASS**

Run: `pnpm exec vitest run src/features/charts/tokenCompositionOption.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write TokenCompositionCard.tsx**

Create `src/features/charts/TokenCompositionCard.tsx`:

```tsx
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { buildTokenCompositionOption } from './tokenCompositionOption'

export function TokenCompositionCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="Token 組成">
      <EChart option={buildTokenCompositionOption(agg.tokenComposition, theme)} />
    </Card>
  )
}
```

- [ ] **Step 6: Render + build**

Edit `Dashboard.tsx`: add `<TokenCompositionCard />` to the grid.
Run: `pnpm build` → green.

- [ ] **Step 7: Commit**

```bash
git add src/features/charts/tokenComposition* src/features/dashboard/Dashboard.tsx
git commit -m "feat(charts): token composition stacked area"
```

---

### Task 8: Model usage timeline

**Files:**
- Create: `src/features/charts/modelTimelineOption.ts`
- Create: `src/features/charts/ModelTimelineCard.tsx`
- Test: `src/features/charts/modelTimelineOption.test.ts`
- Modify: `src/features/dashboard/Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.modelTimeline` (`{date, model, cost}[]`), `categorical`.
- Produces: `buildModelTimelineOption(rows, theme)` — pivots long rows into one line series per model, assigns hues in fixed order of first appearance (never cycled; a 7th+ model folds into "其他"). `<ModelTimelineCard />`.

- [ ] **Step 1: Write option test (TDD)**

Create `src/features/charts/modelTimelineOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildModelTimelineOption } from './modelTimelineOption'
import { CATEGORICAL_LIGHT } from '../../viz/palette'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('pivots to one series per model, fixed-order colors', () => {
  const rows = [
    { date: 'd1', model: 'opus', cost: 3 },
    { date: 'd2', model: 'opus', cost: 4 },
    { date: 'd1', model: 'sonnet', cost: 1 },
  ]
  const opt: any = buildModelTimelineOption(rows, theme)
  const names = opt.series.map((s: any) => s.name)
  expect(names).toEqual(['opus', 'sonnet'])
  expect(opt.series[0].itemStyle.color).toBe(CATEGORICAL_LIGHT[0])
  expect(opt.series[1].itemStyle.color).toBe(CATEGORICAL_LIGHT[1])
  // opus present d1,d2; sonnet only d1 → null on d2 (no fabricated zero)
  expect(opt.series[1].data).toEqual([1, null])
  expect(opt.legend).toBeTruthy()
})

test('7th model folds into 其他, never a cycled hue', () => {
  const rows = Array.from({ length: 7 }, (_, i) => ({ date: 'd1', model: `m${i}`, cost: 1 }))
  const opt: any = buildModelTimelineOption(rows, theme)
  const names = opt.series.map((s: any) => s.name)
  expect(names).toContain('其他')
  expect(opt.series).toHaveLength(6) // 5 named + 其他
})
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm exec vitest run src/features/charts/modelTimelineOption.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write modelTimelineOption.ts**

Create `src/features/charts/modelTimelineOption.ts`:

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { date: string; model: string; cost: number }
const MAX_NAMED = 5 // 6th hue reserved for 其他

export function buildModelTimelineOption(rows: Row[], theme: ChartTheme): EChartsOption {
  const colors = categorical(theme.theme)
  const dates = [...new Set(rows.map((r) => r.date))].sort()
  const totalByModel = new Map<string, number>()
  for (const r of rows) totalByModel.set(r.model, (totalByModel.get(r.model) ?? 0) + r.cost)
  const ranked = [...totalByModel.entries()].sort((a, b) => b[1] - a[1]).map(([m]) => m)
  const named = ranked.slice(0, MAX_NAMED)
  const foldRest = ranked.length > MAX_NAMED

  const label = (m: string) => (named.includes(m) ? m : '其他')
  const seriesNames = foldRest ? [...named, '其他'] : named

  const cell = new Map<string, Map<string, number>>() // name -> date -> cost
  for (const name of seriesNames) cell.set(name, new Map())
  for (const r of rows) {
    const c = cell.get(label(r.model))!
    c.set(r.date, (c.get(r.date) ?? 0) + r.cost)
  }

  return {
    grid: { left: 56, right: 16, top: 32, bottom: 28 },
    legend: { top: 0, textStyle: { color: theme.muted }, icon: 'roundRect' },
    tooltip: { trigger: 'axis', valueFormatter: (v) => (v == null ? '—' : `$${Number(v).toFixed(2)}`) },
    xAxis: {
      type: 'category',
      data: dates,
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `$${v}` },
    },
    series: seriesNames.map((name, i) => ({
      name,
      type: 'line',
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 2, color: colors[i] },
      itemStyle: { color: colors[i] },
      data: dates.map((d) => cell.get(name)!.get(d) ?? null),
    })),
  }
}
```

- [ ] **Step 4: Run → PASS**

Run: `pnpm exec vitest run src/features/charts/modelTimelineOption.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Write ModelTimelineCard.tsx**

Create `src/features/charts/ModelTimelineCard.tsx`:

```tsx
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { buildModelTimelineOption } from './modelTimelineOption'

export function ModelTimelineCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="Model 使用時間軸">
      <EChart option={buildModelTimelineOption(agg.modelTimeline, theme)} />
    </Card>
  )
}
```

- [ ] **Step 6: Render + build**

Edit `Dashboard.tsx`: add `<ModelTimelineCard />` to the grid.
Run: `pnpm build` → green.

- [ ] **Step 7: Commit**

```bash
git add src/features/charts/modelTimeline* src/features/dashboard/Dashboard.tsx
git commit -m "feat(charts): model usage timeline (fixed-order hues, 其他 fold)"
```

---

### Task 9: Cache hit-rate trend

**Files:**
- Create: `src/features/charts/cacheTrendOption.ts`
- Create: `src/features/charts/CacheTrendCard.tsx`
- Test: `src/features/charts/cacheTrendOption.test.ts`
- Modify: `src/features/dashboard/Dashboard.tsx`

**Interfaces:**
- Consumes: `aggregates.cacheTrend` (`{date, hitRate, cacheReadTokens}[]`).
- Produces: `buildCacheTrendOption(data, theme)` — single-series % line (y 0–1 as %), no dual axis. `<CacheTrendCard />`.

- [ ] **Step 1: Write option test (TDD)**

Create `src/features/charts/cacheTrendOption.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildCacheTrendOption } from './cacheTrendOption'

const theme = { theme: 'light' as const, ink: '#111', muted: '#666', grid: '#eee', surface: '#fff' }

test('single % line, y capped 0..1, no legend, no second axis', () => {
  const opt: any = buildCacheTrendOption([{ date: 'd1', hitRate: 0.75, cacheReadTokens: 8000 }], theme)
  expect(opt.series).toHaveLength(1)
  expect(opt.series[0].data).toEqual([0.75])
  expect(opt.yAxis.max).toBe(1)
  expect(opt.legend).toBeUndefined()
  expect(Array.isArray(opt.yAxis)).toBe(false) // one axis only
})
```

- [ ] **Step 2: Run → FAIL**

Run: `pnpm exec vitest run src/features/charts/cacheTrendOption.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write cacheTrendOption.ts**

Create `src/features/charts/cacheTrendOption.ts`:

```ts
import type { EChartsOption } from 'echarts'
import type { ChartTheme } from '../../viz/theme'
import { categorical } from '../../viz/palette'

type Row = { date: string; hitRate: number; cacheReadTokens: number }

export function buildCacheTrendOption(data: Row[], theme: ChartTheme): EChartsOption {
  const color = categorical(theme.theme)[5] // cyan = cache identity
  return {
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (v) => `${(Number(v) * 100).toFixed(1)}%`,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.date),
      axisLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      splitLine: { lineStyle: { color: theme.grid } },
      axisLabel: { color: theme.muted, formatter: (v: number) => `${Math.round(v * 100)}%` },
    },
    series: [
      {
        name: 'Cache 命中率',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: data.map((d) => d.hitRate),
        lineStyle: { width: 2, color },
        areaStyle: { color, opacity: 0.1 },
      },
    ],
  }
}
```

- [ ] **Step 4: Run → PASS**

Run: `pnpm exec vitest run src/features/charts/cacheTrendOption.test.ts`
Expected: PASS.

- [ ] **Step 5: Write CacheTrendCard.tsx**

Create `src/features/charts/CacheTrendCard.tsx`:

```tsx
import { useAggregates } from '../../ui/selectors'
import { useChartTheme } from '../../viz/theme'
import { EChart } from '../../viz/EChart'
import { Card } from '../../ui/Card'
import { buildCacheTrendOption } from './cacheTrendOption'

export function CacheTrendCard() {
  const agg = useAggregates()
  const theme = useChartTheme()
  if (!agg) return null
  return (
    <Card title="Cache 命中率趨勢">
      <EChart option={buildCacheTrendOption(agg.cacheTrend, theme)} />
    </Card>
  )
}
```

- [ ] **Step 6: Render + full verify**

Edit `Dashboard.tsx`: add `<CacheTrendCard />` to the grid.
Run: `pnpm test` (all), `pnpm exec tsc --noEmit`, `pnpm build` → all green.

- [ ] **Step 7: Commit**

```bash
git add src/features/charts/cacheTrend* src/features/dashboard/Dashboard.tsx
git commit -m "feat(charts): cache hit-rate trend"
```

---

## Self-Review

- **Spec coverage:** Import UX (spec §2.3, §7 empty state) → Task 3/4. KPI + live block (cards 1,2) → Task 5. Daily cost (3), token composition (4), model timeline (5), cache trend (7) → Tasks 6–9. Remaining cards (6,8–13), filters, drill-down → **Plan 2b**. ✅
- **dataviz compliance:** validated palette embedded (Task 1); no dual-axis (Task 9 asserts single axis); fixed-order hues + 其他 fold (Task 8); legend for ≥2 series, none for 1 (Tasks 6/9 vs 7/8); 2px surface gap on stacks (Task 7); text uses ink/muted tokens; tooltip on every plot. ✅
- **Placeholder scan:** none — every step has complete code.
- **Type consistency:** `ChartTheme` (Task 1) consumed by every option builder; `buildXOption(data, theme)` shape uniform; selectors return Plan 1's `Aggregates`/`Coverage`. `EChart option` prop is `echarts.EChartsOption` throughout.

## Deferred to Plan 2b

Project ranking, hour heatmap (**local-time** — thread a tz offset into a new selector; keep aggregate pure), $/1M model efficiency, agent share (Claude vs Codex), session-context distribution + P90, cost projection card, "今天為什麼花這麼多", cache-savings tokens; global filters (date range / project / model / agent / branch); session drill-down (reads IndexedDB raw events); table-view + texture accessibility fallback for the CVD floor-band palette.
