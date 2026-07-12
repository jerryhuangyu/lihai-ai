# AI Usage Dashboard — Data Foundation Implementation Plan

> **STATUS: AS-BUILT (2026-07-11).** All 15 tasks implemented on branch `feat/data-foundation`, 41 tests passing, tsc + build green, whole-branch review passed. Two code blocks below were superseded during implementation — see **As-built amendments** at the foot of this file before trusting the inline Task 6 / Task 8 code.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tested, pure-function data pipeline that turns an uploaded `.ccbundle.gz` into chart-ready aggregates persisted in localStorage + IndexedDB.

**Architecture:** A pure pipeline — `bundle → parse → join+allocate cost → aggregate → store`. Every transform is a side-effect-free function unit-tested against fixtures. A Web Worker orchestrates the heavy path; a Dexie store holds raw events; zustand+persist holds small aggregates. This plan stops at a minimal debug view that proves the pipeline end-to-end; the real dashboard UI is Plan 2.

**Tech Stack:** Vite + React + TypeScript, Vitest, zustand (+persist), Dexie (IndexedDB), fflate (gzip), ECharts (Plan 2 only). pnpm.

## Global Constraints

- Package manager: **pnpm** only (never npm).
- Language: TypeScript strict mode on.
- Cost source: **ccusage only**. Never compute cost from a pricing table. Events get cost solely via allocation from ccusage session cost.
- Persistence split: **aggregates → localStorage** (via zustand persist), **raw events → IndexedDB** (via Dexie). Never put raw events in localStorage.
- Allocation invariant: for every ccusage-matched session, Σ(allocated event cost) == session `totalCost` (within 1e-6).
- All parser/join/aggregate modules are **pure** (no IO, no `Date.now()` inside — pass timestamps in).
- UI copy (Plan 2) is Traditional Chinese (Taiwan); code/identifiers English. This plan has almost no user-facing copy.

---

### Task 1: Project scaffold + test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `vitest.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`
- Test: `src/smoke.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `pnpm test` + `pnpm build`. No exported code yet.

- [ ] **Step 1: Scaffold Vite React-TS project**

```bash
pnpm create vite@latest . --template react-ts
pnpm add zustand dexie fflate
pnpm add -D vitest @types/node
```

- [ ] **Step 2: Add vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Enable TS strict**

In `tsconfig.json` ensure `"strict": true` under `compilerOptions`.

- [ ] **Step 4: Write the smoke test**

Create `src/smoke.test.ts`:

```ts
import { expect, test } from 'vitest'

test('harness runs', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm test`
Expected: PASS, 1 test.

- [ ] **Step 6: Verify build**

Run: `pnpm build`
Expected: build succeeds, `dist/` produced.

- [ ] **Step 7: Commit**

```bash
git init && git add -A && git commit -m "chore: scaffold Vite React-TS + vitest"
```

---

### Task 2: Domain types + fixtures

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/fixtures/bundle.sample.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: all shared types below, plus `SAMPLE_BUNDLE: Bundle` fixture used by later tasks.

- [ ] **Step 1: Write the types**

Create `src/domain/types.ts`:

```ts
export type Agent = string // 'claude' | 'codex' | 'gemini' | ...

export interface TokenCounts {
  input: number
  output: number
  cacheCreation: number
  cacheRead: number
}

export interface ModelBreakdown {
  modelName: string
  cost: number
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
}

export interface CcusagePeriodRow {
  period: string
  agent: Agent
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  totalTokens: number
  totalCost: number
  modelBreakdowns: ModelBreakdown[]
  modelsUsed: string[]
}

/** session row: `period` holds the session UUID */
export interface CcusageSessionRow extends CcusagePeriodRow {
  lastActivity?: string
}

export interface CcusageBlock {
  id: string
  startTime: string
  endTime: string
  actualEndTime?: string
  costUSD: number
  isActive: boolean
  isGap: boolean
  models: string[]
  totalTokens: number
  tokenCounts: {
    inputTokens: number
    outputTokens: number
    cacheCreationInputTokens: number
    cacheReadInputTokens: number
  }
  burnRate?: { costPerHour: number; tokensPerMinute: number }
  projection?: { remainingMinutes: number; totalCost: number; totalTokens: number }
}

export interface CcusageNormalized {
  daily: CcusagePeriodRow[]
  weekly: CcusagePeriodRow[]
  monthly: CcusagePeriodRow[]
  session: CcusageSessionRow[]
  blocks: CcusageBlock[]
}

/** raw usage as it appears in JSONL message.usage */
export interface RawUsage {
  input_tokens: number
  output_tokens: number
  cache_creation_input_tokens: number
  cache_read_input_tokens: number
}

export interface RawEvent {
  ts: string
  model: string
  usage: RawUsage
}

export interface BundleSession {
  sessionId: string
  project: string // cwd
  gitBranch?: string
  agent?: Agent
  events: RawEvent[]
}

/** raw ccusage command outputs, as embedded in the bundle */
export interface CcusageRaw {
  daily?: { daily: unknown[]; totals: unknown }
  weekly?: { weekly: unknown[]; totals: unknown }
  monthly?: { monthly: unknown[]; totals: unknown }
  session?: { session: unknown[]; totals: unknown }
  blocks?: { blocks: unknown[] }
}

export interface Bundle {
  v: number
  generatedAt: string
  ccusage: CcusageRaw
  sessions: BundleSession[]
}

/** normalized per-message event (post jsonl parse) */
export interface MessageEvent {
  sessionId: string
  project: string
  gitBranch?: string
  agent: Agent
  ts: string
  model: string
  tokens: TokenCounts
}

/** message event with allocated dollar cost (post join) */
export interface CostedEvent extends MessageEvent {
  cost: number
}

export interface Coverage {
  totalSessions: number
  matchedSessions: number
  totalCost: number
  matchedCost: number
}
```

- [ ] **Step 2: Write the fixture**

Create `src/domain/fixtures/bundle.sample.ts`. Values are shaped from real `ccusage --json` and JSONL captures, de-identified:

```ts
import type { Bundle } from '../types'

export const SAMPLE_BUNDLE: Bundle = {
  v: 1,
  generatedAt: '2026-07-11T00:00:00.000Z',
  ccusage: {
    daily: {
      daily: [
        {
          period: '2026-07-10',
          agent: 'claude',
          inputTokens: 100,
          outputTokens: 2000,
          cacheCreationTokens: 500,
          cacheReadTokens: 8000,
          totalTokens: 10600,
          totalCost: 3.0,
          modelsUsed: ['claude-opus-4-8'],
          modelBreakdowns: [
            {
              modelName: 'claude-opus-4-8',
              cost: 3.0,
              inputTokens: 100,
              outputTokens: 2000,
              cacheCreationTokens: 500,
              cacheReadTokens: 8000,
            },
          ],
        },
      ],
      totals: {},
    },
    weekly: { weekly: [], totals: {} },
    monthly: { monthly: [], totals: {} },
    session: {
      session: [
        {
          period: 'sess-A',
          agent: 'claude',
          inputTokens: 100,
          outputTokens: 2000,
          cacheCreationTokens: 500,
          cacheReadTokens: 8000,
          totalTokens: 10600,
          totalCost: 3.0,
          modelsUsed: ['claude-opus-4-8'],
          metadata: { lastActivity: '2026-07-10T14:00:00.000Z' },
          modelBreakdowns: [
            {
              modelName: 'claude-opus-4-8',
              cost: 3.0,
              inputTokens: 100,
              outputTokens: 2000,
              cacheCreationTokens: 500,
              cacheReadTokens: 8000,
            },
          ],
        },
      ],
      totals: {},
    },
    blocks: {
      blocks: [
        {
          id: '2026-07-10T12:00:00.000Z',
          startTime: '2026-07-10T12:00:00.000Z',
          endTime: '2026-07-10T17:00:00.000Z',
          actualEndTime: '2026-07-10T14:00:00.000Z',
          costUSD: 3.0,
          isActive: false,
          isGap: false,
          models: ['claude-opus-4-8'],
          totalTokens: 10600,
          tokenCounts: {
            inputTokens: 100,
            outputTokens: 2000,
            cacheCreationInputTokens: 500,
            cacheReadInputTokens: 8000,
          },
          burnRate: { costPerHour: 1.5, tokensPerMinute: 88 },
          projection: { remainingMinutes: 0, totalCost: 3.0, totalTokens: 10600 },
        },
      ],
    },
  },
  sessions: [
    {
      sessionId: 'sess-A',
      project: '/Users/dev/code/app',
      gitBranch: 'main',
      agent: 'claude',
      events: [
        {
          ts: '2026-07-10T13:00:00.000Z',
          model: 'claude-opus-4-8',
          usage: {
            input_tokens: 40,
            output_tokens: 800,
            cache_creation_input_tokens: 200,
            cache_read_input_tokens: 3000,
          },
        },
        {
          ts: '2026-07-10T13:30:00.000Z',
          model: 'claude-opus-4-8',
          usage: {
            input_tokens: 60,
            output_tokens: 1200,
            cache_creation_input_tokens: 300,
            cache_read_input_tokens: 5000,
          },
        },
      ],
    },
  ],
}
```

- [ ] **Step 3: Verify it compiles**

Run: `pnpm exec tsc --noEmit`
Expected: no errors (the fixture's `metadata` field on the session is extra but allowed under structural typing since we read via parser; if tsc complains about excess property, it will only do so on the object literal — cast the session literal `as unknown as` is NOT needed because `CcusageRaw.session.session` is `unknown[]`). Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/domain && git commit -m "feat: domain types + sample bundle fixture"
```

---

### Task 3: Bundle parser (gunzip + validate)

**Files:**
- Create: `src/parsers/bundle.ts`
- Test: `src/parsers/bundle.test.ts`

**Interfaces:**
- Consumes: `Bundle` type; `fflate`.
- Produces:
  - `parseBundle(bytes: Uint8Array): Bundle` — gunzips, JSON-parses, validates shape, throws `BundleError` on failure.
  - `class BundleError extends Error`

- [ ] **Step 1: Write the failing test**

Create `src/parsers/bundle.test.ts`:

```ts
import { expect, test } from 'vitest'
import { gzipSync, strToU8 } from 'fflate'
import { parseBundle, BundleError } from './bundle'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

function gz(obj: unknown): Uint8Array {
  return gzipSync(strToU8(JSON.stringify(obj)))
}

test('parses a valid gzipped bundle', () => {
  const out = parseBundle(gz(SAMPLE_BUNDLE))
  expect(out.v).toBe(1)
  expect(out.sessions).toHaveLength(1)
})

test('throws BundleError on non-gzip bytes', () => {
  expect(() => parseBundle(strToU8('not gzip'))).toThrow(BundleError)
})

test('throws BundleError on wrong version', () => {
  expect(() => parseBundle(gz({ ...SAMPLE_BUNDLE, v: 99 }))).toThrow(/version/i)
})

test('throws BundleError when sessions missing', () => {
  const bad = { v: 1, generatedAt: 'x', ccusage: {} }
  expect(() => parseBundle(gz(bad))).toThrow(BundleError)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/parsers/bundle.test.ts`
Expected: FAIL — module `./bundle` not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/parsers/bundle.ts`:

```ts
import { gunzipSync, strFromU8 } from 'fflate'
import type { Bundle } from '../domain/types'

export class BundleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BundleError'
  }
}

const SUPPORTED_VERSION = 1

export function parseBundle(bytes: Uint8Array): Bundle {
  let text: string
  try {
    text = strFromU8(gunzipSync(bytes))
  } catch {
    throw new BundleError('無法解壓 bundle（不是有效的 gzip 檔）')
  }

  let obj: unknown
  try {
    obj = JSON.parse(text)
  } catch {
    throw new BundleError('bundle 內容不是有效 JSON')
  }

  if (typeof obj !== 'object' || obj === null) {
    throw new BundleError('bundle 格式錯誤')
  }
  const b = obj as Partial<Bundle>
  if (b.v !== SUPPORTED_VERSION) {
    throw new BundleError(`不支援的 bundle version：${String(b.v)}（需要 ${SUPPORTED_VERSION}）`)
  }
  if (!Array.isArray(b.sessions)) {
    throw new BundleError('bundle 缺少 sessions')
  }
  if (typeof b.ccusage !== 'object' || b.ccusage === null) {
    throw new BundleError('bundle 缺少 ccusage')
  }
  return b as Bundle
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/parsers/bundle.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/parsers/bundle.ts src/parsers/bundle.test.ts
git commit -m "feat: bundle parser with gunzip + validation"
```

---

### Task 4: ccusage normalizer

**Files:**
- Create: `src/parsers/ccusage.ts`
- Test: `src/parsers/ccusage.test.ts`

**Interfaces:**
- Consumes: `CcusageRaw`, `CcusageNormalized`, `CcusagePeriodRow`, `CcusageSessionRow`, `CcusageBlock`.
- Produces:
  - `normalizeCcusage(raw: CcusageRaw): CcusageNormalized` — pulls the inner arrays out of each command's envelope, coerces session `metadata.lastActivity`, defaults missing commands to `[]`.

- [ ] **Step 1: Write the failing test**

Create `src/parsers/ccusage.test.ts`:

```ts
import { expect, test } from 'vitest'
import { normalizeCcusage } from './ccusage'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

test('normalizes daily/session/blocks arrays', () => {
  const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
  expect(n.daily).toHaveLength(1)
  expect(n.session[0].period).toBe('sess-A')
  expect(n.blocks[0].isActive).toBe(false)
})

test('lifts session metadata.lastActivity', () => {
  const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
  expect(n.session[0].lastActivity).toBe('2026-07-10T14:00:00.000Z')
})

test('missing commands default to empty arrays', () => {
  const n = normalizeCcusage({})
  expect(n.daily).toEqual([])
  expect(n.session).toEqual([])
  expect(n.blocks).toEqual([])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/parsers/ccusage.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/parsers/ccusage.ts`:

```ts
import type {
  CcusageRaw,
  CcusageNormalized,
  CcusagePeriodRow,
  CcusageSessionRow,
  CcusageBlock,
} from '../domain/types'

function asRows(arr: unknown[] | undefined): CcusagePeriodRow[] {
  return (arr ?? []) as CcusagePeriodRow[]
}

export function normalizeCcusage(raw: CcusageRaw): CcusageNormalized {
  const session = ((raw.session?.session ?? []) as Array<
    CcusageSessionRow & { metadata?: { lastActivity?: string } }
  >).map((s) => ({
    ...s,
    lastActivity: s.lastActivity ?? s.metadata?.lastActivity,
  }))

  return {
    daily: asRows(raw.daily?.daily),
    weekly: asRows(raw.weekly?.weekly),
    monthly: asRows(raw.monthly?.monthly),
    session,
    blocks: (raw.blocks?.blocks ?? []) as CcusageBlock[],
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/parsers/ccusage.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/parsers/ccusage.ts src/parsers/ccusage.test.ts
git commit -m "feat: ccusage normalizer"
```

---

### Task 5: JSONL event normalizer + project derivation

**Files:**
- Create: `src/parsers/events.ts`
- Test: `src/parsers/events.test.ts`

**Interfaces:**
- Consumes: `Bundle`, `BundleSession`, `MessageEvent`, `Agent`.
- Produces:
  - `toMessageEvents(sessions: BundleSession[]): MessageEvent[]` — flattens bundle sessions into normalized events; maps `usage.*` → `TokenCounts`; derives `agent` (defaults `'claude'`).
  - `projectLabel(cwd: string): string` — basename of cwd with worktree suffix collapsed (`app.worktrees/foo` and `app` → `app`).

- [ ] **Step 1: Write the failing test**

Create `src/parsers/events.test.ts`:

```ts
import { expect, test } from 'vitest'
import { toMessageEvents, projectLabel } from './events'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

test('flattens sessions into events with mapped tokens', () => {
  const ev = toMessageEvents(SAMPLE_BUNDLE.sessions)
  expect(ev).toHaveLength(2)
  expect(ev[0]).toMatchObject({
    sessionId: 'sess-A',
    project: '/Users/dev/code/app',
    agent: 'claude',
    model: 'claude-opus-4-8',
  })
  expect(ev[0].tokens).toEqual({
    input: 40,
    output: 800,
    cacheCreation: 200,
    cacheRead: 3000,
  })
})

test('projectLabel takes basename', () => {
  expect(projectLabel('/Users/dev/code/app')).toBe('app')
})

test('projectLabel collapses worktree suffix', () => {
  expect(projectLabel('/Users/dev/code/app.worktrees/feature-x')).toBe('app')
  expect(projectLabel('/Users/dev/code/app/.worktrees/feat')).toBe('app')
})

test('agent defaults to claude when absent', () => {
  const ev = toMessageEvents([
    { sessionId: 's', project: '/p', events: [
      { ts: 't', model: 'm', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    ] },
  ])
  expect(ev[0].agent).toBe('claude')
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/parsers/events.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/parsers/events.ts`:

```ts
import type { BundleSession, MessageEvent } from '../domain/types'

/** Collapse a cwd path to a stable project label, folding git worktrees back
 *  onto their base repo so multiple worktrees rank as one project. */
export function projectLabel(cwd: string): string {
  // strip trailing slash, split
  const parts = cwd.replace(/\/+$/, '').split('/').filter(Boolean)
  // find a ".worktrees" or "<repo>.worktrees" segment and take the segment before it
  const wtIdx = parts.findIndex((p) => p === '.worktrees' || p.endsWith('.worktrees'))
  if (wtIdx >= 0) {
    const seg = parts[wtIdx]
    if (seg === '.worktrees') return parts[wtIdx - 1] ?? seg
    return seg.replace(/\.worktrees$/, '')
  }
  return parts[parts.length - 1] ?? cwd
}

export function toMessageEvents(sessions: BundleSession[]): MessageEvent[] {
  const out: MessageEvent[] = []
  for (const s of sessions) {
    const project = projectLabel(s.project)
    const agent = s.agent ?? 'claude'
    for (const e of s.events) {
      out.push({
        sessionId: s.sessionId,
        project,
        gitBranch: s.gitBranch,
        agent,
        ts: e.ts,
        model: e.model,
        tokens: {
          input: e.usage.input_tokens ?? 0,
          output: e.usage.output_tokens ?? 0,
          cacheCreation: e.usage.cache_creation_input_tokens ?? 0,
          cacheRead: e.usage.cache_read_input_tokens ?? 0,
        },
      })
    }
  }
  return out
}
```

Note: `projectLabel` in Step 1 test expects `/Users/dev/code/app` → `app` (raw label) while events keep full `project` path from the bundle. Reconcile: `toMessageEvents` DOES apply `projectLabel`. Fix the first events test to expect the label. Update `events.test.ts` first assertion `project: 'app'` — see Step 4.

- [ ] **Step 4: Fix test expectation to match label semantics**

In `src/parsers/events.test.ts`, change the first test's `project: '/Users/dev/code/app'` to `project: 'app'` (events store the collapsed label, not the raw cwd).

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm exec vitest run src/parsers/events.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 6: Commit**

```bash
git add src/parsers/events.ts src/parsers/events.test.ts
git commit -m "feat: jsonl event normalizer + worktree-aware project label"
```

---

### Task 6: Join + cost allocation

**Files:**
- Create: `src/join/allocateCost.ts`
- Test: `src/join/allocateCost.test.ts`

**Interfaces:**
- Consumes: `CcusageSessionRow`, `MessageEvent`, `CostedEvent`, `Coverage`.
- Produces:
  - `allocateCost(sessions: CcusageSessionRow[], events: MessageEvent[]): { costed: CostedEvent[]; coverage: Coverage }`
  - Allocation rule: group events by `sessionId`, then by `model`. For each (session, model) with a matching ccusage `modelBreakdowns` entry, split that entry's `cost` across the model's events proportional to each event's total tokens (sum of 4 token types). Fallback when a model has no breakdown match: split the session `totalCost` remainder proportional to token weight. Unmatched sessions → cost 0.

- [ ] **Step 1: Write the failing test**

Create `src/join/allocateCost.test.ts`:

```ts
import { expect, test } from 'vitest'
import { allocateCost } from './allocateCost'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
const ev = toMessageEvents(SAMPLE_BUNDLE.sessions)

test('allocated cost sums to session totalCost (invariant)', () => {
  const { costed } = allocateCost(n.session, ev)
  const total = costed.reduce((a, e) => a + e.cost, 0)
  expect(total).toBeCloseTo(3.0, 6)
})

test('allocation is proportional to token weight', () => {
  const { costed } = allocateCost(n.session, ev)
  // event0 weight = 40+800+200+3000 = 4040; event1 = 60+1200+300+5000 = 6560; total 10600
  expect(costed[0].cost).toBeCloseTo(3.0 * (4040 / 10600), 6)
  expect(costed[1].cost).toBeCloseTo(3.0 * (6560 / 10600), 6)
})

test('unmatched session gets zero cost and lowers coverage', () => {
  const orphanEvents = toMessageEvents([
    { sessionId: 'ghost', project: '/p', events: [
      { ts: 't', model: 'm', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    ] },
  ])
  const { costed, coverage } = allocateCost(n.session, [...ev, ...orphanEvents])
  const ghost = costed.find((e) => e.sessionId === 'ghost')!
  expect(ghost.cost).toBe(0)
  expect(coverage.matchedSessions).toBe(1)
  expect(coverage.totalSessions).toBe(2)
})

test('zero-token model splits equally to avoid div-by-zero', () => {
  const sessions = [{
    period: 's0', agent: 'claude', inputTokens: 0, outputTokens: 0,
    cacheCreationTokens: 0, cacheReadTokens: 0, totalTokens: 0, totalCost: 2.0,
    modelsUsed: ['m'], modelBreakdowns: [{ modelName: 'm', cost: 2.0, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }],
  }]
  const events = toMessageEvents([{ sessionId: 's0', project: '/p', events: [
    { ts: 't1', model: 'm', usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
    { ts: 't2', model: 'm', usage: { input_tokens: 0, output_tokens: 0, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } },
  ] }])
  const { costed } = allocateCost(sessions, events)
  expect(costed[0].cost).toBeCloseTo(1.0, 6)
  expect(costed[1].cost).toBeCloseTo(1.0, 6)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/join/allocateCost.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/join/allocateCost.ts`:

```ts
import type {
  CcusageSessionRow,
  MessageEvent,
  CostedEvent,
  Coverage,
} from '../domain/types'

function weight(e: MessageEvent): number {
  const t = e.tokens
  return t.input + t.output + t.cacheCreation + t.cacheRead
}

export function allocateCost(
  sessions: CcusageSessionRow[],
  events: MessageEvent[],
): { costed: CostedEvent[]; coverage: Coverage } {
  const byId = new Map<string, CcusageSessionRow>()
  for (const s of sessions) byId.set(s.period, s)

  // group events by session
  const bySession = new Map<string, MessageEvent[]>()
  for (const e of events) {
    const arr = bySession.get(e.sessionId) ?? []
    arr.push(e)
    bySession.set(e.sessionId, arr)
  }

  const costed: CostedEvent[] = []
  let matchedSessions = 0
  let matchedCost = 0
  const totalCost = sessions.reduce((a, s) => a + s.totalCost, 0)

  for (const [sid, evs] of bySession) {
    const sess = byId.get(sid)
    if (!sess) {
      for (const e of evs) costed.push({ ...e, cost: 0 })
      continue
    }
    matchedSessions++
    matchedCost += sess.totalCost

    // cost per model from breakdowns; fallback bucket for unlisted models
    const modelCost = new Map<string, number>()
    for (const b of sess.modelBreakdowns) modelCost.set(b.modelName, b.cost)

    // group this session's events by model
    const byModel = new Map<string, MessageEvent[]>()
    for (const e of evs) {
      const arr = byModel.get(e.model) ?? []
      arr.push(e)
      byModel.set(e.model, arr)
    }

    for (const [model, mevs] of byModel) {
      // if model not in breakdowns, fall back to session-total share
      const cost = modelCost.has(model)
        ? modelCost.get(model)!
        : sess.totalCost /* fallback: whole session cost weight-split below */
      const totalW = mevs.reduce((a, e) => a + weight(e), 0)
      for (const e of mevs) {
        const share = totalW > 0 ? weight(e) / totalW : 1 / mevs.length
        costed.push({ ...e, cost: cost * share })
      }
    }
  }

  return {
    costed,
    coverage: {
      totalSessions: bySession.size,
      matchedSessions,
      totalCost,
      matchedCost,
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/join/allocateCost.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/join && git commit -m "feat: session cost allocation with invariant + coverage"
```

---

### Task 7: Time-series aggregates

**Files:**
- Create: `src/aggregate/timeseries.ts`
- Test: `src/aggregate/timeseries.test.ts`

**Interfaces:**
- Consumes: `CcusageNormalized`, `CcusagePeriodRow`.
- Produces:
  - `dailyCost(n): { date: string; cost: number }[]`
  - `tokenComposition(n): { date: string; input: number; output: number; cacheCreation: number; cacheRead: number }[]`
  - `cacheTrend(n): { date: string; hitRate: number; cacheReadTokens: number }[]` — hitRate = cacheRead / totalTokens (0 when total 0).
  - `modelTimeline(n): { date: string; model: string; cost: number }[]`
  - All sorted ascending by date.

- [ ] **Step 1: Write the failing test**

Create `src/aggregate/timeseries.test.ts`:

```ts
import { expect, test } from 'vitest'
import { dailyCost, tokenComposition, cacheTrend, modelTimeline } from './timeseries'
import { normalizeCcusage } from '../parsers/ccusage'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)

test('dailyCost maps period+totalCost', () => {
  expect(dailyCost(n)).toEqual([{ date: '2026-07-10', cost: 3.0 }])
})

test('tokenComposition splits token types', () => {
  expect(tokenComposition(n)[0]).toEqual({
    date: '2026-07-10', input: 100, output: 2000, cacheCreation: 500, cacheRead: 8000,
  })
})

test('cacheTrend computes hit rate', () => {
  const t = cacheTrend(n)[0]
  expect(t.hitRate).toBeCloseTo(8000 / 10600, 6)
})

test('modelTimeline emits per model per date', () => {
  expect(modelTimeline(n)).toEqual([
    { date: '2026-07-10', model: 'claude-opus-4-8', cost: 3.0 },
  ])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/aggregate/timeseries.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/aggregate/timeseries.ts`:

```ts
import type { CcusageNormalized } from '../domain/types'

const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)

export function dailyCost(n: CcusageNormalized) {
  return n.daily
    .map((r) => ({ date: r.period, cost: r.totalCost }))
    .sort(byDate)
}

export function tokenComposition(n: CcusageNormalized) {
  return n.daily
    .map((r) => ({
      date: r.period,
      input: r.inputTokens,
      output: r.outputTokens,
      cacheCreation: r.cacheCreationTokens,
      cacheRead: r.cacheReadTokens,
    }))
    .sort(byDate)
}

export function cacheTrend(n: CcusageNormalized) {
  return n.daily
    .map((r) => ({
      date: r.period,
      hitRate: r.totalTokens > 0 ? r.cacheReadTokens / r.totalTokens : 0,
      cacheReadTokens: r.cacheReadTokens,
    }))
    .sort(byDate)
}

export function modelTimeline(n: CcusageNormalized) {
  const out: { date: string; model: string; cost: number }[] = []
  for (const r of n.daily) {
    for (const b of r.modelBreakdowns) {
      out.push({ date: r.period, model: b.modelName, cost: b.cost })
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.model.localeCompare(b.model))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/aggregate/timeseries.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/aggregate/timeseries.ts src/aggregate/timeseries.test.ts
git commit -m "feat: time-series aggregates (cost, tokens, cache, model timeline)"
```

---

### Task 8: Analytical aggregates (project, heatmap, agent, efficiency, distribution)

**Files:**
- Create: `src/aggregate/analytics.ts`
- Test: `src/aggregate/analytics.test.ts`

**Interfaces:**
- Consumes: `CcusageNormalized`, `CostedEvent`.
- Produces:
  - `projectRanking(costed): { project: string; cost: number; tokens: number }[]` (desc by cost).
  - `hourHeatmap(costed): { weekday: number; hour: number; cost: number }[]` — weekday 0–6 (0=Sun), hour 0–23, from `ts` (UTC).
  - `agentShare(n): { agent: string; cost: number }[]` (desc).
  - `modelEfficiency(n): { model: string; costPerMillionOutput: number }[]` — Σcost / Σoutput × 1e6, desc by efficiency (lowest cost-per-output first).
  - `sessionDistribution(n): { totals: number[]; p50: number; p90: number }` — per-session totalTokens + percentiles.

- [ ] **Step 1: Write the failing test**

Create `src/aggregate/analytics.test.ts`:

```ts
import { expect, test } from 'vitest'
import {
  projectRanking, hourHeatmap, agentShare, modelEfficiency, sessionDistribution,
} from './analytics'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

const n = normalizeCcusage(SAMPLE_BUNDLE.ccusage)
const { costed } = allocateCost(n.session, toMessageEvents(SAMPLE_BUNDLE.sessions))

test('projectRanking aggregates cost + tokens by project', () => {
  const r = projectRanking(costed)
  expect(r).toEqual([{ project: 'app', cost: 3.0, tokens: 10600 }])
})

test('hourHeatmap buckets by weekday+hour (UTC)', () => {
  const h = hourHeatmap(costed)
  // both events on 2026-07-10 (Friday=5), hours 13
  const cell = h.find((c) => c.weekday === 5 && c.hour === 13)!
  expect(cell.cost).toBeCloseTo(3.0, 6)
})

test('agentShare sums cost by agent', () => {
  expect(agentShare(n)).toEqual([{ agent: 'claude', cost: 3.0 }])
})

test('modelEfficiency computes $/1M output', () => {
  const e = modelEfficiency(n)[0]
  expect(e.model).toBe('claude-opus-4-8')
  expect(e.costPerMillionOutput).toBeCloseTo((3.0 / 2000) * 1e6, 6)
})

test('sessionDistribution returns totals + percentiles', () => {
  const d = sessionDistribution(n)
  expect(d.totals).toEqual([10600])
  expect(d.p90).toBe(10600)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/aggregate/analytics.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/aggregate/analytics.ts`:

```ts
import type { CcusageNormalized, CostedEvent } from '../domain/types'

export function projectRanking(costed: CostedEvent[]) {
  const m = new Map<string, { cost: number; tokens: number }>()
  for (const e of costed) {
    const cur = m.get(e.project) ?? { cost: 0, tokens: 0 }
    cur.cost += e.cost
    cur.tokens += e.tokens.input + e.tokens.output + e.tokens.cacheCreation + e.tokens.cacheRead
    m.set(e.project, cur)
  }
  return [...m.entries()]
    .map(([project, v]) => ({ project, ...v }))
    .sort((a, b) => b.cost - a.cost)
}

export function hourHeatmap(costed: CostedEvent[]) {
  const m = new Map<string, number>()
  for (const e of costed) {
    const d = new Date(e.ts)
    const key = `${d.getUTCDay()}:${d.getUTCHours()}`
    m.set(key, (m.get(key) ?? 0) + e.cost)
  }
  return [...m.entries()].map(([k, cost]) => {
    const [weekday, hour] = k.split(':').map(Number)
    return { weekday, hour, cost }
  })
}

export function agentShare(n: CcusageNormalized) {
  const m = new Map<string, number>()
  for (const r of n.daily) m.set(r.agent, (m.get(r.agent) ?? 0) + r.totalCost)
  return [...m.entries()]
    .map(([agent, cost]) => ({ agent, cost }))
    .sort((a, b) => b.cost - a.cost)
}

export function modelEfficiency(n: CcusageNormalized) {
  const m = new Map<string, { cost: number; output: number }>()
  for (const r of n.daily) {
    for (const b of r.modelBreakdowns) {
      const cur = m.get(b.modelName) ?? { cost: 0, output: 0 }
      cur.cost += b.cost
      cur.output += b.outputTokens
      m.set(b.modelName, cur)
    }
  }
  return [...m.entries()]
    .map(([model, v]) => ({
      model,
      costPerMillionOutput: v.output > 0 ? (v.cost / v.output) * 1e6 : 0,
    }))
    .sort((a, b) => a.costPerMillionOutput - b.costPerMillionOutput)
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.min(Math.max(idx, 0), sorted.length - 1)]
}

export function sessionDistribution(n: CcusageNormalized) {
  const totals = n.session.map((s) => s.totalTokens)
  const sorted = [...totals].sort((a, b) => a - b)
  return { totals, p50: percentile(sorted, 50), p90: percentile(sorted, 90) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/aggregate/analytics.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
git add src/aggregate/analytics.ts src/aggregate/analytics.test.ts
git commit -m "feat: analytical aggregates (project, heatmap, agent, efficiency, distribution)"
```

---

### Task 9: KPIs, projection, and "why today" delta

**Files:**
- Create: `src/aggregate/kpi.ts`
- Test: `src/aggregate/kpi.test.ts`

**Interfaces:**
- Consumes: `CcusageNormalized`, `CcusageBlock`.
- Produces:
  - `kpis(n): { totalCost: number; avgPerDay: number; burnRatePerHour: number; deltaPct: number }` — deltaPct = last-day vs prior-day cost change.
  - `activeBlock(n): CcusageBlock | null` — first block with `isActive`.
  - `monthEndProjection(n, todayIso: string): number` — current-month cost extrapolated linearly to month end (needs today passed in, no `Date.now()`).
  - `whyToday(n, todayIso: string): { delta: number; byModel: { model: string; delta: number }[] }` — today vs trailing-7-day avg, decomposed by model.

- [ ] **Step 1: Write the failing test**

Create `src/aggregate/kpi.test.ts`:

```ts
import { expect, test } from 'vitest'
import { kpis, activeBlock, monthEndProjection, whyToday } from './kpi'
import type { CcusageNormalized } from '../domain/types'

function mk(dailyRows: Array<{ date: string; cost: number; model?: string }>): CcusageNormalized {
  return {
    daily: dailyRows.map((d) => ({
      period: d.date, agent: 'claude',
      inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0,
      totalTokens: 0, totalCost: d.cost, modelsUsed: [d.model ?? 'm'],
      modelBreakdowns: [{ modelName: d.model ?? 'm', cost: d.cost, inputTokens: 0, outputTokens: 0, cacheCreationTokens: 0, cacheReadTokens: 0 }],
    })),
    weekly: [], monthly: [], session: [], blocks: [],
  }
}

test('kpis totals + avg + day-over-day delta', () => {
  const n = mk([{ date: '2026-07-09', cost: 10 }, { date: '2026-07-10', cost: 15 }])
  const k = kpis(n)
  expect(k.totalCost).toBe(25)
  expect(k.avgPerDay).toBe(12.5)
  expect(k.deltaPct).toBeCloseTo(50, 6) // 10 -> 15
})

test('activeBlock returns the active one or null', () => {
  const n = mk([{ date: '2026-07-10', cost: 1 }])
  expect(activeBlock(n)).toBeNull()
})

test('monthEndProjection extrapolates linearly', () => {
  // 2 days into month, $20 total -> $10/day -> 31-day month => $310
  const n = mk([{ date: '2026-07-01', cost: 10 }, { date: '2026-07-02', cost: 10 }])
  expect(monthEndProjection(n, '2026-07-02')).toBeCloseTo(310, 6)
})

test('whyToday decomposes delta by model vs trailing avg', () => {
  const n = mk([
    { date: '2026-07-03', cost: 10, model: 'a' },
    { date: '2026-07-04', cost: 10, model: 'a' },
    { date: '2026-07-05', cost: 30, model: 'a' },
  ])
  const w = whyToday(n, '2026-07-05')
  expect(w.delta).toBeCloseTo(20, 6) // 30 vs avg 10
  expect(w.byModel[0]).toEqual({ model: 'a', delta: 20 })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/aggregate/kpi.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/aggregate/kpi.ts`:

```ts
import type { CcusageNormalized, CcusageBlock } from '../domain/types'

function sortedDaily(n: CcusageNormalized) {
  return [...n.daily].sort((a, b) => a.period.localeCompare(b.period))
}

export function kpis(n: CcusageNormalized) {
  const d = sortedDaily(n)
  const totalCost = d.reduce((a, r) => a + r.totalCost, 0)
  const avgPerDay = d.length ? totalCost / d.length : 0
  let deltaPct = 0
  if (d.length >= 2) {
    const prev = d[d.length - 2].totalCost
    const last = d[d.length - 1].totalCost
    deltaPct = prev > 0 ? ((last - prev) / prev) * 100 : 0
  }
  const burnRatePerHour =
    n.blocks.find((b) => b.isActive)?.burnRate?.costPerHour ?? 0
  return { totalCost, avgPerDay, burnRatePerHour, deltaPct }
}

export function activeBlock(n: CcusageNormalized): CcusageBlock | null {
  return n.blocks.find((b) => b.isActive) ?? null
}

export function monthEndProjection(n: CcusageNormalized, todayIso: string): number {
  const month = todayIso.slice(0, 7) // YYYY-MM
  const rows = n.daily.filter((r) => r.period.startsWith(month))
  if (rows.length === 0) return 0
  const spent = rows.reduce((a, r) => a + r.totalCost, 0)
  const dayOfMonth = Number(todayIso.slice(8, 10))
  const daysInMonth = new Date(
    Number(month.slice(0, 4)),
    Number(month.slice(5, 7)),
    0,
  ).getDate()
  const perDay = spent / dayOfMonth
  return perDay * daysInMonth
}

export function whyToday(n: CcusageNormalized, todayIso: string) {
  const d = sortedDaily(n)
  const today = d.find((r) => r.period === todayIso)
  const prior = d.filter((r) => r.period < todayIso).slice(-7)
  const avg = prior.length ? prior.reduce((a, r) => a + r.totalCost, 0) / prior.length : 0
  const delta = (today?.totalCost ?? 0) - avg

  // per-model today vs per-model trailing avg
  const todayByModel = new Map<string, number>()
  for (const b of today?.modelBreakdowns ?? []) {
    todayByModel.set(b.modelName, (todayByModel.get(b.modelName) ?? 0) + b.cost)
  }
  const priorSumByModel = new Map<string, number>()
  for (const r of prior) {
    for (const b of r.modelBreakdowns) {
      priorSumByModel.set(b.modelName, (priorSumByModel.get(b.modelName) ?? 0) + b.cost)
    }
  }
  const models = new Set([...todayByModel.keys(), ...priorSumByModel.keys()])
  const byModel = [...models]
    .map((model) => ({
      model,
      delta:
        (todayByModel.get(model) ?? 0) -
        (prior.length ? (priorSumByModel.get(model) ?? 0) / prior.length : 0),
    }))
    .sort((a, b) => b.delta - a.delta)

  return { delta, byModel }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/aggregate/kpi.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add src/aggregate/kpi.ts src/aggregate/kpi.test.ts
git commit -m "feat: KPIs, month-end projection, why-today delta"
```

---

### Task 10: Aggregate roll-up (single entry point)

**Files:**
- Create: `src/aggregate/index.ts`
- Test: `src/aggregate/index.test.ts`

**Interfaces:**
- Consumes: all aggregate fns, `normalizeCcusage`, `toMessageEvents`, `allocateCost`.
- Produces:
  - `interface Aggregates { … }` — the frozen selector API Plan 2 consumes.
  - `buildAggregates(bundle: Bundle, todayIso: string): { aggregates: Aggregates; costed: CostedEvent[]; coverage: Coverage }`

- [ ] **Step 1: Write the failing test**

Create `src/aggregate/index.test.ts`:

```ts
import { expect, test } from 'vitest'
import { buildAggregates } from './index'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

test('buildAggregates produces every card series', () => {
  const { aggregates, costed, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  expect(aggregates.dailyCost).toHaveLength(1)
  expect(aggregates.projectRanking[0].project).toBe('app')
  expect(aggregates.kpis.totalCost).toBe(3.0)
  expect(costed).toHaveLength(2)
  expect(coverage.matchedSessions).toBe(1)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/aggregate/index.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/aggregate/index.ts`:

```ts
import type { Bundle, CostedEvent, Coverage } from '../domain/types'
import { normalizeCcusage } from '../parsers/ccusage'
import { toMessageEvents } from '../parsers/events'
import { allocateCost } from '../join/allocateCost'
import { dailyCost, tokenComposition, cacheTrend, modelTimeline } from './timeseries'
import {
  projectRanking, hourHeatmap, agentShare, modelEfficiency, sessionDistribution,
} from './analytics'
import { kpis, activeBlock, monthEndProjection, whyToday } from './kpi'

export interface Aggregates {
  dailyCost: ReturnType<typeof dailyCost>
  tokenComposition: ReturnType<typeof tokenComposition>
  cacheTrend: ReturnType<typeof cacheTrend>
  modelTimeline: ReturnType<typeof modelTimeline>
  projectRanking: ReturnType<typeof projectRanking>
  hourHeatmap: ReturnType<typeof hourHeatmap>
  agentShare: ReturnType<typeof agentShare>
  modelEfficiency: ReturnType<typeof modelEfficiency>
  sessionDistribution: ReturnType<typeof sessionDistribution>
  kpis: ReturnType<typeof kpis>
  activeBlock: ReturnType<typeof activeBlock>
  monthEndProjection: number
  whyToday: ReturnType<typeof whyToday>
}

export function buildAggregates(
  bundle: Bundle,
  todayIso: string,
): { aggregates: Aggregates; costed: CostedEvent[]; coverage: Coverage } {
  const n = normalizeCcusage(bundle.ccusage)
  const events = toMessageEvents(bundle.sessions)
  const { costed, coverage } = allocateCost(n.session, events)

  const aggregates: Aggregates = {
    dailyCost: dailyCost(n),
    tokenComposition: tokenComposition(n),
    cacheTrend: cacheTrend(n),
    modelTimeline: modelTimeline(n),
    projectRanking: projectRanking(costed),
    hourHeatmap: hourHeatmap(costed),
    agentShare: agentShare(n),
    modelEfficiency: modelEfficiency(n),
    sessionDistribution: sessionDistribution(n),
    kpis: kpis(n),
    activeBlock: activeBlock(n),
    monthEndProjection: monthEndProjection(n, todayIso),
    whyToday: whyToday(n, todayIso),
  }
  return { aggregates, costed, coverage }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/aggregate/index.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/aggregate/index.ts src/aggregate/index.test.ts
git commit -m "feat: aggregate roll-up + frozen Aggregates selector API"
```

---

### Task 11: Raw event store (Dexie / IndexedDB)

**Files:**
- Create: `src/store/rawDb.ts`
- Test: `src/store/rawDb.test.ts`

**Interfaces:**
- Consumes: `CostedEvent`; `dexie`; `fake-indexeddb` (dev dep for tests).
- Produces:
  - `saveEvents(events: CostedEvent[]): Promise<void>` — clears then bulk-puts.
  - `eventsBySession(sessionId: string): Promise<CostedEvent[]>`
  - `clearEvents(): Promise<void>`

- [ ] **Step 1: Add test-only IndexedDB polyfill**

```bash
pnpm add -D fake-indexeddb
```

Create `src/store/rawDb.test.ts`:

```ts
import 'fake-indexeddb/auto'
import { expect, test, beforeEach } from 'vitest'
import { saveEvents, eventsBySession, clearEvents } from './rawDb'
import type { CostedEvent } from '../domain/types'

const ev: CostedEvent[] = [
  { sessionId: 's1', project: 'app', agent: 'claude', ts: 't', model: 'm',
    tokens: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 }, cost: 0.5 },
  { sessionId: 's2', project: 'app', agent: 'claude', ts: 't', model: 'm',
    tokens: { input: 1, output: 1, cacheCreation: 0, cacheRead: 0 }, cost: 0.5 },
]

beforeEach(async () => { await clearEvents() })

test('saveEvents then query by session', async () => {
  await saveEvents(ev)
  const got = await eventsBySession('s1')
  expect(got).toHaveLength(1)
  expect(got[0].cost).toBe(0.5)
})

test('saveEvents replaces prior data', async () => {
  await saveEvents(ev)
  await saveEvents([ev[0]])
  expect(await eventsBySession('s2')).toHaveLength(0)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/store/rawDb.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/store/rawDb.ts`:

```ts
import Dexie, { type Table } from 'dexie'
import type { CostedEvent } from '../domain/types'

class RawDb extends Dexie {
  events!: Table<CostedEvent & { id?: number }, number>
  constructor() {
    super('cc-dashboard-raw')
    this.version(1).stores({ events: '++id, sessionId, project, model' })
  }
}

const db = new RawDb()

export async function saveEvents(events: CostedEvent[]): Promise<void> {
  await db.transaction('rw', db.events, async () => {
    await db.events.clear()
    await db.events.bulkPut(events)
  })
}

export async function eventsBySession(sessionId: string): Promise<CostedEvent[]> {
  return db.events.where('sessionId').equals(sessionId).toArray()
}

export async function clearEvents(): Promise<void> {
  await db.events.clear()
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/store/rawDb.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/rawDb.ts src/store/rawDb.test.ts package.json
git commit -m "feat: Dexie raw-event store with session query"
```

---

### Task 12: Aggregate store (zustand + persist)

**Files:**
- Create: `src/store/useDataStore.ts`
- Test: `src/store/useDataStore.test.ts`

**Interfaces:**
- Consumes: `Aggregates`, `Coverage`; `zustand`.
- Produces:
  - `useDataStore` with state `{ aggregates: Aggregates | null; coverage: Coverage | null; generatedAt: string | null; setResult(r): void; reset(): void }`
  - persists to localStorage key `cc-dashboard-aggregates`.

- [ ] **Step 1: Write the failing test**

Create `src/store/useDataStore.test.ts`:

```ts
import { expect, test, beforeEach } from 'vitest'
import { useDataStore } from './useDataStore'
import { buildAggregates } from '../aggregate'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

beforeEach(() => useDataStore.getState().reset())

test('setResult stores aggregates + coverage', () => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: '2026-07-11T00:00:00.000Z' })
  expect(useDataStore.getState().aggregates?.kpis.totalCost).toBe(3.0)
  expect(useDataStore.getState().coverage?.matchedSessions).toBe(1)
})

test('reset clears state', () => {
  useDataStore.getState().reset()
  expect(useDataStore.getState().aggregates).toBeNull()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/store/useDataStore.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/store/useDataStore.ts`:

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Aggregates } from '../aggregate'
import type { Coverage } from '../domain/types'

interface Result {
  aggregates: Aggregates
  coverage: Coverage
  generatedAt: string
}

interface DataState {
  aggregates: Aggregates | null
  coverage: Coverage | null
  generatedAt: string | null
  setResult: (r: Result) => void
  reset: () => void
}

export const useDataStore = create<DataState>()(
  persist(
    (set) => ({
      aggregates: null,
      coverage: null,
      generatedAt: null,
      setResult: (r) =>
        set({ aggregates: r.aggregates, coverage: r.coverage, generatedAt: r.generatedAt }),
      reset: () => set({ aggregates: null, coverage: null, generatedAt: null }),
    }),
    { name: 'cc-dashboard-aggregates' },
  ),
)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/store/useDataStore.test.ts`
Expected: PASS, 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/store/useDataStore.ts src/store/useDataStore.test.ts
git commit -m "feat: zustand aggregate store with localStorage persist"
```

---

### Task 13: Import orchestration (bundle bytes → stores)

**Files:**
- Create: `src/import/importBundle.ts`
- Test: `src/import/importBundle.test.ts`

**Interfaces:**
- Consumes: `parseBundle`, `buildAggregates`, `saveEvents`, `useDataStore`.
- Produces:
  - `importBundle(bytes: Uint8Array, todayIso: string): Promise<{ coverage: Coverage }>` — parse → build → persist aggregates (store) + raw events (Dexie). Runs on the main thread in tests; Task 14 wires the worker.

- [ ] **Step 1: Write the failing test**

Create `src/import/importBundle.test.ts`:

```ts
import 'fake-indexeddb/auto'
import { expect, test, beforeEach } from 'vitest'
import { gzipSync, strToU8 } from 'fflate'
import { importBundle } from './importBundle'
import { useDataStore } from '../store/useDataStore'
import { eventsBySession } from '../store/rawDb'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

beforeEach(() => useDataStore.getState().reset())

test('importBundle populates aggregate store + raw db', async () => {
  const bytes = gzipSync(strToU8(JSON.stringify(SAMPLE_BUNDLE)))
  const { coverage } = await importBundle(bytes, '2026-07-10')
  expect(coverage.matchedSessions).toBe(1)
  expect(useDataStore.getState().aggregates?.kpis.totalCost).toBe(3.0)
  expect(await eventsBySession('sess-A')).toHaveLength(2)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/import/importBundle.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

Create `src/import/importBundle.ts`:

```ts
import type { Coverage } from '../domain/types'
import { parseBundle } from '../parsers/bundle'
import { buildAggregates } from '../aggregate'
import { saveEvents } from '../store/rawDb'
import { useDataStore } from '../store/useDataStore'

export async function importBundle(
  bytes: Uint8Array,
  todayIso: string,
): Promise<{ coverage: Coverage }> {
  const bundle = parseBundle(bytes)
  const { aggregates, costed, coverage } = buildAggregates(bundle, todayIso)
  await saveEvents(costed)
  useDataStore.getState().setResult({
    aggregates,
    coverage,
    generatedAt: bundle.generatedAt,
  })
  return { coverage }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/import/importBundle.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/import/importBundle.ts src/import/importBundle.test.ts
git commit -m "feat: importBundle orchestration (parse -> build -> persist)"
```

---

### Task 14: Export-command generator + round-trip test

**Files:**
- Create: `src/export/exportCommand.ts`
- Create: `scripts/build-bundle.mjs`
- Test: `src/export/exportCommand.test.ts`
- Test: `scripts/build-bundle.test.mjs` (round-trip via Node)

**Interfaces:**
- Consumes: `parseBundle` (round-trip assertion).
- Produces:
  - `EXPORT_COMMAND: string` — the exact copy-paste one-liner the UI shows. It runs `scripts/build-bundle.mjs` contents inline via `node -e` OR references a hosted script. For MVP the UI ships the full inline command.
  - `scripts/build-bundle.mjs` — the real generator: runs `npx ccusage` three times, walks `~/.claude/projects/**/*.jsonl`, emits `~/cc-usage-bundle.json.gz`.

- [ ] **Step 1: Write the generator script**

Create `scripts/build-bundle.mjs`:

```js
#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { gzipSync } from 'node:zlib'

function ccusage(cmd) {
  const out = execFileSync('npx', ['-y', 'ccusage@latest', cmd, '--json'], {
    encoding: 'utf8', maxBuffer: 1 << 28,
  })
  return JSON.parse(out)
}

function walk(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) files.push(...walk(p))
    else if (name.endsWith('.jsonl')) files.push(p)
  }
  return files
}

function parseSession(file) {
  const events = []
  let sessionId, project, gitBranch
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    let o
    try { o = JSON.parse(line) } catch { continue }
    sessionId ??= o.sessionId
    project ??= o.cwd
    gitBranch ??= o.gitBranch
    const u = o.message?.usage
    if (u && o.message?.model) {
      events.push({
        ts: o.timestamp,
        model: o.message.model,
        usage: {
          input_tokens: u.input_tokens ?? 0,
          output_tokens: u.output_tokens ?? 0,
          cache_creation_input_tokens: u.cache_creation_input_tokens ?? 0,
          cache_read_input_tokens: u.cache_read_input_tokens ?? 0,
        },
      })
    }
  }
  if (!sessionId || events.length === 0) return null
  return { sessionId, project: project ?? 'unknown', gitBranch, events }
}

const projectsDir = join(homedir(), '.claude', 'projects')
const sessions = walk(projectsDir).map(parseSession).filter(Boolean)

const bundle = {
  v: 1,
  generatedAt: new Date().toISOString(),
  ccusage: {
    daily: ccusage('daily'),
    session: ccusage('session'),
    blocks: ccusage('blocks'),
  },
  sessions,
}

const out = join(homedir(), 'cc-usage-bundle.json.gz')
writeFileSync(out, gzipSync(Buffer.from(JSON.stringify(bundle))))
console.log(`Wrote ${out} (${sessions.length} sessions)`)
```

- [ ] **Step 2: Write the round-trip test**

Verifies the exact envelope shape `build-bundle.mjs` emits (Node `zlib` gzip) is accepted by the client's `parseBundle` (fflate gunzip) — guards against the two libs disagreeing.

Create `scripts/build-bundle.test.mjs`:

```js
import { test, expect } from 'vitest'
import { gzipSync } from 'node:zlib'
import { parseBundle } from '../src/parsers/bundle'

test('generator envelope round-trips through parseBundle', () => {
  const bundle = {
    v: 1, generatedAt: 'x', ccusage: { daily: {}, session: {}, blocks: {} }, sessions: [],
  }
  const bytes = new Uint8Array(gzipSync(Buffer.from(JSON.stringify(bundle))))
  const parsed = parseBundle(bytes)
  expect(parsed.v).toBe(1)
  expect(parsed.sessions).toEqual([])
})
```

- [ ] **Step 3: Add scripts dir to vitest include**

In `vitest.config.ts`, change `include` to `['src/**/*.test.ts', 'scripts/**/*.test.mjs']`.

- [ ] **Step 4: Write EXPORT_COMMAND constant**

Create `src/export/exportCommand.ts`:

```ts
/** Command the UI shows next to a "下載 build-bundle.mjs" button. The user
 *  downloads the generator (served as a static asset by the app), then runs it.
 *  It writes ~/cc-usage-bundle.json.gz to drag back into the app. */
export const EXPORT_COMMAND = 'node ~/Downloads/build-bundle.mjs'

export const EXPORT_HINT =
  '1. 下載 build-bundle.mjs　2. 於終端機執行上面指令　3. 產生 ~/cc-usage-bundle.json.gz 後拖進本頁'
```

Create `src/export/exportCommand.test.ts`:

```ts
import { expect, test } from 'vitest'
import { EXPORT_COMMAND } from './exportCommand'

test('export command references the bundle generator', () => {
  expect(EXPORT_COMMAND).toContain('build-bundle.mjs')
})
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm test`
Expected: PASS across all suites including the round-trip.

- [ ] **Step 6: Commit**

```bash
git add src/export scripts vitest.config.ts
git commit -m "feat: bundle generator script + export command + round-trip test"
```

---

### Task 15: Web Worker wiring + debug view

**Files:**
- Create: `src/workers/parse.worker.ts`
- Create: `src/import/importViaWorker.ts`
- Modify: `src/App.tsx`
- Test: `src/import/importViaWorker.test.ts`

**Interfaces:**
- Consumes: `importBundle` (the worker calls it inside the worker context); `useDataStore`.
- Produces:
  - `parse.worker.ts` — receives `{ bytes, todayIso }`, runs parse+build (NOT Dexie/zustand which are main-thread), posts back `{ aggregates, costed, coverage, generatedAt }`.
  - `importViaWorker(file: File, todayIso: string): Promise<Coverage>` — reads File → ArrayBuffer, posts to worker, on reply persists to Dexie + store on main thread.
  - `App.tsx` — a minimal drag-drop that calls `importViaWorker` and renders `kpis.totalCost` + coverage as text (proves end-to-end; real UI is Plan 2).

Note: worker does pure compute only; IndexedDB + zustand writes happen on main thread after the worker replies, keeping the worker free of DOM/storage deps.

- [ ] **Step 1: Refactor buildAggregates call out of importBundle for worker reuse**

The worker must run parse+build without touching Dexie/zustand. `buildAggregates` (Task 10) already does exactly that. The worker will import `parseBundle` + `buildAggregates` only.

- [ ] **Step 2: Write the worker**

Create `src/workers/parse.worker.ts`:

```ts
import { parseBundle } from '../parsers/bundle'
import { buildAggregates } from '../aggregate'

self.onmessage = (e: MessageEvent<{ bytes: ArrayBuffer; todayIso: string }>) => {
  try {
    const bundle = parseBundle(new Uint8Array(e.data.bytes))
    const { aggregates, costed, coverage } = buildAggregates(bundle, e.data.todayIso)
    ;(self as unknown as Worker).postMessage({
      ok: true,
      aggregates,
      costed,
      coverage,
      generatedAt: bundle.generatedAt,
    })
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
```

- [ ] **Step 3: Write the main-thread wrapper**

Create `src/import/importViaWorker.ts`:

```ts
import type { Coverage, CostedEvent } from '../domain/types'
import type { Aggregates } from '../aggregate'
import { saveEvents } from '../store/rawDb'
import { useDataStore } from '../store/useDataStore'

interface WorkerReply {
  ok: boolean
  error?: string
  aggregates?: Aggregates
  costed?: CostedEvent[]
  coverage?: Coverage
  generatedAt?: string
}

export async function importViaWorker(file: File, todayIso: string): Promise<Coverage> {
  const bytes = await file.arrayBuffer()
  const worker = new Worker(new URL('../workers/parse.worker.ts', import.meta.url), {
    type: 'module',
  })
  try {
    const reply = await new Promise<WorkerReply>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<WorkerReply>) => resolve(e.data)
      worker.onerror = (e) => reject(new Error(e.message))
      worker.postMessage({ bytes, todayIso }, [bytes])
    })
    if (!reply.ok || !reply.aggregates || !reply.costed || !reply.coverage) {
      throw new Error(reply.error ?? '解析失敗')
    }
    await saveEvents(reply.costed)
    useDataStore.getState().setResult({
      aggregates: reply.aggregates,
      coverage: reply.coverage,
      generatedAt: reply.generatedAt ?? '',
    })
    return reply.coverage
  } finally {
    worker.terminate()
  }
}
```

- [ ] **Step 4: Write a test for the wrapper's persistence path (worker mocked)**

Create `src/import/importViaWorker.test.ts`:

```ts
import 'fake-indexeddb/auto'
import { expect, test, vi, beforeEach } from 'vitest'
import { buildAggregates } from '../aggregate'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'
import { useDataStore } from '../store/useDataStore'
import { eventsBySession } from '../store/rawDb'

// jsdom lacks real Workers; stub Worker to synchronously reply with computed data.
class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  postMessage() {
    const { aggregates, costed, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
    this.onmessage?.({ data: { ok: true, aggregates, costed, coverage, generatedAt: 'x' } } as MessageEvent)
  }
  terminate() {}
}

beforeEach(() => useDataStore.getState().reset())

test('importViaWorker persists worker reply to store + db', async () => {
  vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker)
  const { importViaWorker } = await import('./importViaWorker')
  const file = { arrayBuffer: async () => new ArrayBuffer(8) } as unknown as File
  const coverage = await importViaWorker(file, '2026-07-10')
  expect(coverage.matchedSessions).toBe(1)
  expect(useDataStore.getState().aggregates?.kpis.totalCost).toBe(3.0)
  expect(await eventsBySession('sess-A')).toHaveLength(2)
})
```

This test needs jsdom. Add `environmentMatchGlobs` OR set this file to jsdom via a top docblock: add `// @vitest-environment jsdom` as the first line of the test file, and `pnpm add -D jsdom`.

- [ ] **Step 5: Wire a minimal debug App**

Modify `src/App.tsx`:

```tsx
import { useState } from 'react'
import { importViaWorker } from './import/importViaWorker'
import { useDataStore } from './store/useDataStore'

export default function App() {
  const [err, setErr] = useState<string | null>(null)
  const agg = useDataStore((s) => s.aggregates)
  const cov = useDataStore((s) => s.coverage)

  async function onFile(f: File) {
    setErr(null)
    try {
      await importViaWorker(f, new Date().toISOString().slice(0, 10))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui' }}>
      <h1>AI Usage Dashboard — debug</h1>
      <input
        type="file"
        accept=".gz,.json"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {err && <p style={{ color: 'crimson' }}>{err}</p>}
      {agg && (
        <pre>
          {JSON.stringify(
            { totalCost: agg.kpis.totalCost, coverage: cov },
            null,
            2,
          )}
        </pre>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Run tests + typecheck + build**

Run: `pnpm test && pnpm exec tsc --noEmit && pnpm build`
Expected: all PASS, build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/workers src/import/importViaWorker.ts src/import/importViaWorker.test.ts src/App.tsx package.json
git commit -m "feat: parse worker + import wiring + debug view"
```

---

## Self-Review

**Spec coverage:**

- §2.1 ccusage schema → Tasks 2, 4. ✅
- §2.2 JSONL schema (cwd/branch/ts/usage) → Tasks 2, 5, 14 (generator). ✅
- §2.3 bundle import + envelope + fflate → Tasks 3, 14. ✅
- §2.4 join + allocation + invariant → Task 6. ✅
- §3 stack (Vite/React/TS/zustand/Dexie/fflate) → Tasks 1, 11, 12. ECharts deferred to Plan 2. ✅
- §4 architecture layers → Tasks 3–15. ✅
- §5 modules (bundle/ccusage/jsonl/allocate/aggregate/worker/store/rawDb) → Tasks 3–15. Filters + card components + DashboardGrid → **Plan 2** (view layer). ✅ (intentional split)
- §6 cards computations → Tasks 7–9 produce every listed series (daily cost, token composition, model timeline, $/1M, cache trend, project ranking, hour heatmap, agent share, session dist+P90, projection, why-today, live block). Rendering → Plan 2. ✅
- §7 error/partial handling → Task 3 (bundle errors), Task 6 (coverage). Empty-state UI copy → Plan 2. ✅
- §8 testing → every task is TDD; invariant test in Task 6. ✅
- §9 YAGNI cuts → honored (no git ROI, no tool-usage, no pricing table). ✅

**Placeholder scan:** Task 14 Step 2 intentionally shows a placeholder test THEN its corrected final form; the final code block is complete — ensure the implementer writes the final version. No other placeholders.

**Type consistency:** `Aggregates` (Task 10) consumed by Tasks 12, 15. `CostedEvent` (Task 2) flows Tasks 6→11→13→15. `Coverage` (Task 2) flows Tasks 6→12→13→15. `buildAggregates(bundle, todayIso)` signature identical in Tasks 10, 13, 15. `setResult({aggregates, coverage, generatedAt})` identical in Tasks 12, 13, 15. Consistent.

**Note for Plan 2:** consumes the frozen `Aggregates` API from `src/aggregate/index.ts` and `eventsBySession` from `src/store/rawDb.ts`. Builds ECharts cards, filters, grid, drill-down, empty states, and the export-command UI panel.

---

## As-built amendments (post-review)

The inline task code above is the plan-as-written. Two blocks were corrected during TDD/review; the repo reflects the corrected versions:

1. **Task 6 `allocateCost` (commits ...→ba36216)** — the fallback for a model absent from `modelBreakdowns` originally used the full `sess.totalCost`, breaking the invariant when a session mixed listed + unlisted models, and a phantom breakdown (listed model, no events) dropped cost. As-built: listed models with events split their own breakdown cost; a single pooled **residual** = `totalCost − Σ(listed-with-events cost)` is carried by unlisted-model events, or spread across all session events when there are none. Invariant `Σ allocated == totalCost` now holds unconditionally (7 tests incl mixed-model, phantom, two-unlisted, zero-token).

2. **Task 8 `agentShare` (commit 113959e)** — originally summed `n.daily` by `agent`, but real `ccusage daily --json` rows always carry `agent='all'`, collapsing the multi-agent card to one bucket. As-built: group `n.session` by `session.agent` (real per-agent cost; session is also the only source covering non-Claude agents).

## Deferred to Plan 2 (documented, not defects)

- `hourHeatmap` buckets in **UTC**; Plan 2 decides local vs UTC (thread a tz offset in to keep the aggregate pure).
- `allocateCost` residual can go negative under ccusage overshoot drift (`Σ breakdowns > totalCost`); invariant still holds but individual events could show negative $. Add a guard/test if observed on real data.
- **Coverage semantics:** `Coverage.totalSessions/matchedSessions` count JSONL event-sessions; `totalCost/matchedCost` sum ccusage session cost (all agents). The meaningful "coverage %" is `matchedCost/totalCost`. Non-Claude agents (codex/gemini/opencode) have ccusage cost but no JSONL under `~/.claude/projects`, so they appear in KPIs/agentShare but not projectRanking/heatmap — surface this in the Plan 2 UI.
