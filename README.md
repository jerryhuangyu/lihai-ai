<div align="center">

<img src="public/favicon.svg" alt="LiHai" width="72" height="72">

# LiHai Usage Dashboard

Turn your agent-CLI usage data into a product-grade analytics panel — **fully static, drag-and-drop, zero install, no cloud DB.**

**[中文](README.zh-TW.md)** · **[English](README.md)** · **[Live app](https://jerryhuangyu.github.io/lihai-ai/)**

</div>

LiHai reads the usage produced by agent CLIs (Claude Code / Codex) and renders it as an analytics dashboard in the spirit of Linear Analytics × Vercel Analytics × GitHub Insights — cost trends, token composition, model efficiency, per-project ranking, hour-of-day heatmaps, and session drilldown.

> [!NOTE]
> **Your data never leaves your browser.** Existing tools (ccgauge, MyCCusage, and friends) all run a local server or daemon that watches `~/.claude`. LiHai goes the other way: a static site that ingests a single bundle file you drag in. Aggregates live in `localStorage`, raw events in IndexedDB — nothing is uploaded, nothing hits a backend.

## Getting started

No clone, no install. Open the [live app](https://jerryhuangyu.github.io/lihai-ai/), then:

1. Paste this one-liner into your terminal (needs `curl` + `node`):

   ```bash
   curl -fsSL https://jerryhuangyu.github.io/lihai-ai/build-bundle.mjs | node --input-type=module
   ```

   It fetches the generator, runs `ccusage --json` (the authoritative cost source) and recursively reads `~/.claude/projects/**/*.jsonl` (project, git branch, per-message timestamps), then writes a single gzip bundle to `~/lihai-bundle.json.gz`.

2. Drag `~/lihai-bundle.json.gz` into the app.

> [!TIP]
> No `curl`? The import panel also offers `build-bundle.mjs` as a plain download — run it with `node build-bundle.mjs`.

## Features

- **KPI row** — total cost, tokens, sessions, and a live view of the active 5-hour billing block (burn rate + projection).
- **Cost & tokens** — daily cost trend, cost by token type, token composition, cache-read trend.
- **Models** — model efficiency, model timeline, agent share (Claude Code vs Codex).
- **Projects & time** — project ranking, session distribution, hour-of-day heatmap, month-end projection.
- **Drilldown** — a filterable session list with per-session timelines.
- **Filters** — slice every card by date range in one place.
- Dark mode, Traditional Chinese / English toggle, responsive layout.

## How it works

The client gunzips the bundle with `fflate`, joins cost and events by `sessionId`, then aggregates. Aggregates are persisted to `localStorage` (zustand `persist`); raw events go to IndexedDB (Dexie). Parsing runs in a Web Worker so large JSONL files don't block the UI.

> [!IMPORTANT]
> **Cost comes only from ccusage** — LiHai never builds its own pricing table. Per-event cost is derived by distributing each session's `totalCost` weighted by tokens. The invariant, asserted in tests: for every matched session, Σ(event cost) == session `totalCost`.

## Pages

| Route       | Purpose                              |
| ----------- | ------------------------------------ |
| `index`     | Dashboard overview — KPIs + charts   |
| `analysis`  | Deep analysis and drilldown          |
| `sessions`  | Session list                         |

## Stack

- **Vite + React 19 + TypeScript** (strict), pnpm
- **Router** — TanStack Router (auto code-splitting)
- **State** — zustand (+persist); raw events in Dexie (IndexedDB); gzip via fflate
- **Charts** — ECharts
- **UI** — shadcn/ui + Base UI + Tailwind v4
- **Tests** — Vitest; parser / join / aggregate are pure functions written TDD-first

## Development

```bash
pnpm install
pnpm dev      # dev server
pnpm build    # tsc -b + vite build  (use this for type checks, not bare `tsc --noEmit`)
pnpm test     # vitest run
pnpm lint     # oxlint
```

> [!WARNING]
> Type-check with `pnpm build`, not bare `tsc --noEmit`. The root `tsconfig` is solution-style (references only), so a bare `tsc --noEmit` checks nothing and silently passes.

## Deploy

Every push to `main` triggers [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml), which runs `pnpm build` and publishes to GitHub Pages under the `/lihai-ai/` subpath (SPA deep links fall back through `404.html`). A separate weekly workflow refreshes LLM prices via PR.

## Docs

- Design spec — [`docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md`](docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md)
- Implementation plans — [`docs/superpowers/plans/`](docs/superpowers/plans/)
