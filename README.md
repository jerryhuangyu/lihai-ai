# LiHai AI Dashboard

**[中文](README.zh-TW.md)** | **[English](README.md)**

Frontend-only AI Usage Dashboard. Turns usage data from agent CLIs (Claude Code / Codex) into an analytics panel in the style of Linear Analytics × Vercel Analytics × GitHub Insights.

**Live**: <https://jerryhuangyu.github.io/lihai-ai/>

**Positioning**: existing OSS (ccgauge, MyCCusage, etc.) all run a local server/daemon that watches `~/.claude`. This project goes the other way — **fully static site, drag-and-drop upload, zero install, no cloud DB**. Your data never leaves your browser.

## Getting started

No clone, no install. Open the [live app](https://jerryhuangyu.github.io/lihai-ai/), then:

1. Paste this one-liner into your terminal (needs `curl` + `node`):
   ```bash
   curl -fsSL https://jerryhuangyu.github.io/lihai-ai/build-bundle.mjs | node --input-type=module
   ```
   It fetches the generator, runs `ccusage --json` (authoritative cost) and recursively reads `~/.claude/projects/**/*.jsonl` (project, branch, per-message timestamps), then writes a single gzip bundle to `~/lihai-bundle.json.gz`.
2. Drag `~/lihai-bundle.json.gz` into the app.

Everything runs locally — the bundle is never uploaded anywhere. (No `curl`? The import panel also offers `build-bundle.mjs` as a plain download.)

## How it works

The client gunzips the bundle with fflate, joins cost and events by `sessionId`, and aggregates. Aggregates are stored in localStorage (zustand persist); raw events go to IndexedDB (Dexie).

**Cost comes only from ccusage** — no hand-built pricing table. Per-event cost is derived by distributing the session `totalCost` weighted by tokens (invariant: for every matched session, Σ event cost == session `totalCost`).

## Pages

- `index`: dashboard overview (KPIs + charts)
- `analysis`: deep analysis and drilldown
- `sessions`: session list

## Stack

- Vite + React 19 + TypeScript (strict), pnpm
- Router: TanStack Router (autoCodeSplitting)
- State: zustand (+persist); raw events: Dexie (IndexedDB); gzip: fflate
- Charts: ECharts. UI: shadcn/ui + Base UI + Tailwind v4
- Tests: Vitest (parser / join / aggregate as pure functions, TDD)

## Development

```bash
pnpm install
pnpm dev            # dev server
pnpm build          # tsc -b + vite build (use this for type checks, not bare tsc --noEmit)
pnpm test           # vitest run
pnpm lint           # oxlint
```

## Deploy

Every push to `main` triggers `.github/workflows/deploy.yml`, which runs `pnpm build` and publishes to GitHub Pages (served under the `/lihai-ai/` subpath; SPA deep links fall back through `404.html`).

## Docs

- Design spec: `docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md`
- Implementation plan: `docs/superpowers/plans/2026-07-11-data-foundation.md`
