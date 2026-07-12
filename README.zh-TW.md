# LiHai AI Dashboard

**[中文](README.zh-TW.md)** | **[English](README.md)**

純前端 AI Usage Dashboard。把 Claude Code / Codex 等 agent CLI 的用量資料，做成 Linear Analytics × Vercel Analytics × GitHub Insights 風格的分析面板。

**Live**：<https://jerryhuangyu.github.io/lihai-ai/>

**定位**：現有 OSS（ccgauge、MyCCusage 等）全部跑本地 server/daemon watch `~/.claude`。本專案走**純靜態站、拖拉上傳、零安裝、不落地雲端 DB**——資料只留在你瀏覽器。

## 開始使用

免 clone、免安裝。開啟 [線上版](https://jerryhuangyu.github.io/lihai-ai/)，然後：

1. 於終端機貼上這行（需要 `curl` + `node`）：
   ```bash
   curl -fsSL https://jerryhuangyu.github.io/lihai-ai/build-bundle.mjs | node --input-type=module
   ```
   它會抓取產生器，跑 `ccusage --json`（權威成本）+ 遞迴讀 `~/.claude/projects/**/*.jsonl`（專案、branch、逐訊息時間戳），輸出單一 gzip bundle 到 `~/lihai-bundle.json.gz`。
2. 把 `~/lihai-bundle.json.gz` 拖進 app。

全程本機執行——bundle 不會上傳到任何地方。（沒有 `curl`？匯入面板也提供 `build-bundle.mjs` 直接下載。）

## 運作方式

client 端用 fflate gunzip、以 `sessionId` join 成本與事件、聚合。聚合結果存 localStorage（zustand persist），原始事件存 IndexedDB（Dexie）。

**成本來源唯一為 ccusage**，絕不自建 pricing table。事件成本由 session `totalCost` 依 token 權重分攤（不變式：每個 matched session，Σ 事件成本 == session `totalCost`）。

## 頁面

- `index`：Dashboard 總覽（KPI + 圖表）
- `analysis`：深入分析與 drilldown
- `sessions`：session 列表

## Stack

- Vite + React 19 + TypeScript（strict），pnpm
- Router：TanStack Router（autoCodeSplitting）
- 狀態：zustand(+persist)；原始事件：Dexie(IndexedDB)；gzip：fflate
- 圖表：ECharts。UI：shadcn/ui + Base UI + Tailwind v4
- 測試：Vitest（parser / join / aggregate 純函式 TDD）

## 開發

```bash
pnpm install
pnpm dev            # 開發伺服器
pnpm build          # tsc -b + vite build（型別檢查走這個，勿用裸 tsc --noEmit）
pnpm test           # vitest run
pnpm lint           # oxlint
```

## 部署

`main` 每次 push 觸發 `.github/workflows/deploy.yml`，`pnpm build` 後發佈 GitHub Pages（子路徑 `/lihai-ai/`，SPA 深連結由 `404.html` fallback 接手）。

## 文件

- 設計 spec：`docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md`
- 實作計劃：`docs/superpowers/plans/2026-07-11-data-foundation.md`
