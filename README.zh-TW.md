<div align="center">

<img src="public/favicon.svg" alt="LiHai" width="72" height="72">

# LiHai Usage Dashboard

把 agent CLI 的用量資料，做成產品級的分析面板——**純靜態、拖拉上傳、零安裝、不落地雲端 DB。**

**[中文](README.zh-TW.md)** · **[English](README.md)** · **[線上版](https://jerryhuangyu.github.io/lihai-ai/)**

</div>

LiHai 讀取 Claude Code / Codex 等 agent CLI 產出的用量，渲染成 Linear Analytics × Vercel Analytics × GitHub Insights 風格的分析面板——成本趨勢、token 組成、model 效率、專案排名、時段 heatmap、session drilldown。

> [!NOTE]
> **資料只留在你的瀏覽器。** 現有工具（ccgauge、MyCCusage 等）全部跑本地 server/daemon watch `~/.claude`。LiHai 走相反路線：純靜態站，只吃你拖進來的單一 bundle 檔。聚合結果存 `localStorage`、原始事件存 IndexedDB——不上傳、不打任何後端。

## 開始使用

免 clone、免安裝。開啟 [線上版](https://jerryhuangyu.github.io/lihai-ai/)，然後：

1. 於終端機貼上這行（需要 `curl` + `node`）：

   ```bash
   curl -fsSL https://jerryhuangyu.github.io/lihai-ai/build-bundle.mjs | node --input-type=module
   ```

   它會抓取產生器，跑 `ccusage --json`（權威成本來源）+ 遞迴讀 `~/.claude/projects/**/*.jsonl`（專案、git branch、逐訊息時間戳），輸出單一 gzip bundle 到 `~/lihai-bundle.json.gz`。

2. 把 `~/lihai-bundle.json.gz` 拖進 app。

> [!TIP]
> 沒有 `curl`？匯入面板也提供 `build-bundle.mjs` 直接下載——用 `node build-bundle.mjs` 執行即可。

## 功能

- **KPI 列**——總成本、tokens、session 數，以及當前 5 小時計費視窗的即時狀態（burn rate + 推估）。
- **成本與 token**——每日成本趨勢、依 token 類型的成本、token 組成、cache-read 趨勢。
- **Models**——model 效率、model 時間軸、agent 佔比（Claude Code vs Codex）。
- **專案與時段**——專案排名、session 分佈、時段 heatmap、月底成本推估。
- **Drilldown**——可篩選的 session 列表，附各 session 時間軸。
- **篩選**——單一入口依日期區間切所有卡片。
- 深色模式、繁體中文 / English 切換、RWD 版面。

## 運作方式

client 端用 `fflate` gunzip，以 `sessionId` join 成本與事件，再聚合。聚合結果存 `localStorage`（zustand `persist`），原始事件存 IndexedDB（Dexie）。解析跑在 Web Worker，大 JSONL 不卡 UI。

> [!IMPORTANT]
> **成本來源唯一為 ccusage**——LiHai 絕不自建 pricing table。事件成本由 session `totalCost` 依 token 權重分攤。測試斷言的不變式：每個 matched session，Σ(事件成本) == session `totalCost`。

## 頁面

| 路由        | 用途                        |
| ----------- | --------------------------- |
| `index`     | Dashboard 總覽——KPI + 圖表  |
| `analysis`  | 深入分析與 drilldown        |
| `sessions`  | session 列表                |

## Stack

- **Vite + React 19 + TypeScript**（strict），pnpm
- **Router**——TanStack Router（auto code-splitting）
- **狀態**——zustand(+persist)；原始事件存 Dexie(IndexedDB)；gzip 走 fflate
- **圖表**——ECharts
- **UI**——shadcn/ui + Base UI + Tailwind v4
- **測試**——Vitest；parser / join / aggregate 皆純函式，TDD 先行

## 開發

```bash
pnpm install
pnpm dev      # 開發伺服器
pnpm build    # tsc -b + vite build（型別檢查走這個，勿用裸 tsc --noEmit）
pnpm test     # vitest run
pnpm lint     # oxlint
```

> [!WARNING]
> 型別檢查用 `pnpm build`，不要用裸 `tsc --noEmit`。root `tsconfig` 是 solution-style（只有 references），裸 `tsc --noEmit` 實際上不檢查任何檔案、會靜默通過。

## 部署

`main` 每次 push 觸發 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)，`pnpm build` 後發佈 GitHub Pages（子路徑 `/lihai-ai/`，SPA 深連結由 `404.html` fallback 接手）。另有每週 workflow 以 PR 更新 LLM 價格。

## 文件

- 設計 spec——[`docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md`](docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md)
- 實作計劃——[`docs/superpowers/plans/`](docs/superpowers/plans/)
