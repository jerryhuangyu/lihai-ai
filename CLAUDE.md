# cc-dashboard

純前端 AI Usage Dashboard。資料來源 = 上傳 ccusage JSON + 原始 JSONL 打包成的單一 bundle，不落地雲端 DB。聚合結果存 localStorage(zustand)，原始事件存 IndexedDB(Dexie)。

## Commit 政策（覆寫全域規則）

- **本專案授權主動 commit**：實作完成可直接 `git commit`（覆寫全域「絕不主動 commit/push/reset」）。
- 仍**不主動 push**、不 `reset --hard`、不改寫已推歷史。
- Conventional Commits；merge 偏好 squash。
- Commit message 結尾附 `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`。

## 執行模式

- **Subagent-Driven Development**：每個 plan task 派 fresh subagent（TDD），task 間 review，再進下一個。
- 依 `docs/superpowers/plans/*.md` 逐 task 推進。

## Stack

- Vite + React + TypeScript（strict），pnpm。
- 狀態 zustand(+persist)；原始事件 Dexie(IndexedDB)；gzip 用 fflate。
- 圖表 ECharts。UI shadcn/ui + @efferd blocks + Tailwind。
- 測試 Vitest（parser/join/aggregate 全純函式 TDD）。

## 建置/驗證 gotcha

- **型別檢查用 `pnpm build`（= `tsc -b`），不要用裸 `tsc --noEmit`** — root tsconfig 是 solution-style（只有 references），裸 `tsc --noEmit` 實際上不檢查任何檔案（no-op）。
- Dark mode 走 shadcn/@efferd 的 **`.dark` class**（`:root` 上），非 `data-theme` attribute；圖表 `useChartTheme` 已對齊偵測 `.dark`。
- 分支流程：feature branch → squash-merge 進 main → 刪分支。

## 持久化 schema 紀律（易踩雷）

- **改 `Aggregates` 形狀（含巢狀新欄位，如某 aggregate 多一個 field）→ 必須 bump `src/store/useDataStore.ts` 的 persist `version`**。否則舊 localStorage blob 會 rehydrate 成缺欄位的物件，餵給卡片 → runtime crash（如 `undefined.toFixed`）。version 不符時 zustand 會丟棄舊 blob → ImportPanel。
- 讀「可能來自舊 blob」的欄位時，卡片/option 加防禦（`?? 0`）當第二道防線。

## 關鍵設計約束

- **成本只來自 ccusage**，絕不自建 pricing table。事件成本由 ccusage session 成本依 token 權重分攤。
- 分攤不變式：每個 matched session，Σ(事件成本) == session `totalCost`。
- 持久化切分：聚合 → localStorage；原始事件 → IndexedDB，絕不把原始事件塞 localStorage。
- parser/join/aggregate 一律純函式，不在內部呼叫 `Date.now()`（時間由外部傳入）。

## 文件

- 設計 spec：`docs/superpowers/specs/2026-07-11-ai-usage-dashboard-design.md`
- 實作計劃：`docs/superpowers/plans/2026-07-11-data-foundation.md`（Plan 1 資料層；Plan 2 UI 待寫）
