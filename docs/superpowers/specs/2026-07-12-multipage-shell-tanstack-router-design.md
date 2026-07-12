# 多頁面 Shell（TanStack Router）+ 死 chrome 清理 設計

**日期：** 2026-07-12
**狀態：** 設計待審

## 目標

把單頁長捲 Dashboard 拆成 3 個真頁面（TanStack Router file-based），並移除 @efferd 樣板留下的所有無意義死 chrome（假 nav、通知鈕、假使用者、changelog stub）。header 右側改放真的 dark mode 切換。

## 背景（as-is）

- 無 router。`main.tsx → App → AppShell → Dashboard`。
- `AppShell`（`src/components/app-shell.tsx`）= `SidebarProvider + AppSidebar + AppHeader + content wrapper`。
- `Dashboard`（`src/features/dashboard/Dashboard.tsx`）：`!hasData` 顯示 `ImportPanel`；有資料則渲染 coverage 列 + `FilterBar` + 重新匯入 + `KpiRow` + 5 段卡 grid。
- 死 chrome：
  - Sidebar 10 個 nav item 全是 `href="#/…"` hash anchor（無 route，點了無效）：Dashboard/Analytics/Projects/Team/Integrations/API Keys/Settings/Billing/Help/Documentation。
  - `LatestChange`（changelog stub，hardcoded）。
  - Header 的 `Send`、`Bell` 兩顆按鈕無 handler。
  - `NavUser` 假人「Shaban Haider」，選單項全無 onClick。
- Dark mode：`src/viz/theme.ts` 偵測 `document.documentElement` 的 `.dark`/`.light` class、`data-theme` attr、OS media query，並 observe class/attr mutation + matchMedia change。**目前沒有任何程式設 `.dark`**，暗色只由 OS 偏好決定，無使用者可控切換。

## 決策（已與使用者收斂）

1. **3 頁**：
   - `/` 總覽 — `KpiRow` + 成本段 + 用量組成段
   - `/analysis` 分析 — 專案與時段段 + 效率與分布段
   - `/sessions` Session 明細 — `SessionListCard`
2. **持久列**（root layout 跨頁常駐）：coverage 涵蓋率 + `FilterBar` + 重新匯入。`KpiRow` 只在總覽頁。
3. **Header 右側**：全砍 Send/Bell/假 NavUser，改放一顆真的亮/暗主題切換鈕。

## 架構

### 路由（TanStack Router file-based）

- 套件：`@tanstack/react-router`（runtime）、`@tanstack/router-plugin`（dev）。以 pnpm 安裝。
- `vite.config.ts`：加 `tanstackRouter({ target: 'react', autoCodeSplitting: true })`，**放在 `react()` 之前**。
- routes 目錄 `src/routes/`，自動生成 `src/routeTree.gen.ts`。
- **`src/routeTree.gen.ts` 提交進 git（不 gitignore）**：build script 是 `tsc -b && vite build`，`tsc -b` 先跑；若 gen file 被 ignore，fresh checkout 首次 `pnpm build` 會因缺檔失敗。提交 gen file 讓型別 gate 一律可用（本專案小、route 少，diff 噪音可接受）。

```
src/routes/
  __root.tsx     根 layout：shell + 無資料 guard + 持久列 + <Outlet/>
  index.tsx      /          總覽
  analysis.tsx   /analysis  分析
  sessions.tsx   /sessions  Session 明細
```

**`__root.tsx`**（`createRootRoute`）：搬進原 `AppShell` 的組成（`SidebarProvider/AppSidebar/AppHeader/content wrapper`）。content 區內：
- `useHasData()` 為 false → 渲染 `<ImportPanel/>`（維持現行行為：ImportPanel 帶著 sidebar/header 一起顯示）。
- 為 true → 渲染 持久列（coverage + `FilterBar` + 重新匯入）＋ `<Outlet/>`。

**各頁 route**（`createFileRoute`）component 僅組合既有卡片 + `DashboardGrid` + 段標題 `<h2>`，無新商業邏輯：
- `index.tsx`：`KpiRow`；成本段（`DailyCostCard`/`ProjectionCard`/`WhyTodayCard`/`CostByTokenTypeCard`）；用量組成段（`TokenCompositionCard`/`ModelTimelineCard`/`ModelEfficiencyCard`）。
- `analysis.tsx`：專案與時段段（`ProjectRankingCard`/`HourHeatmapCard`）；效率與分布段（`CacheTrendCard`/`SessionDistCard`/`AgentShareCard`）。
- `sessions.tsx`：`SessionListCard`。

**`main.tsx`**：`createRouter({ routeTree })` + `<RouterProvider router={router}/>`，含 `declare module '@tanstack/react-router'` 型別註冊。`TooltipProvider` 包在 RouterProvider 外或移入 `__root.tsx`。`App.tsx` 移除。

### Sidebar 重寫

- `src/components/app-shared.tsx` nav data：3 個真項（總覽 `/`、分析 `/analysis`、Session `/sessions`），各配 lucide icon。移除 Team/Integrations/API Keys/Settings/Billing/Help/Documentation/Analytics/Projects 死項。
- `src/components/app-sidebar.tsx`：nav 用 TanStack `Link` + `activeProps`（或 `activeOptions`）標示 active，取代原 `isActive` 靜態旗標。移除 `LatestChange`。品牌 header「Efferd」logo 改為 app 名稱（非連結，或連 `/`）。移除 footer Help/Documentation。
- `nav-group.tsx` 若不再需要 collapsible 群組可簡化；保留與否依重寫時最小改動決定。

### Header 重寫

- `src/components/app-header.tsx`：移除 `Send`、`Bell` 按鈕與 `NavUser`。右側改放 `<ThemeToggle/>`。
- Breadcrumb：由 matched route 的標題驅動（route `staticData.title` 或等價），取代原 `activeItem` 靜態查找。
- `src/components/nav-user.tsx` 移除（或留檔不引用；優先移除以清 dead code）。

### Dark mode 切換（新增，自足）

- `src/store/useThemeStore.ts`：zustand + persist（獨立 key，如 `cc-dashboard-theme`），state `mode: 'light' | 'dark' | 'system'`（預設 `system`）。**不影響 Aggregates persist，無需 bump 該 version。**
- 一個 apply 函式/effect：依 mode 在 `document.documentElement` 設 `.dark` 或 `.light` class（`system` → 移除兩者、回落 OS 偏好）。啟動時套用一次。
- `src/components/theme-toggle.tsx`：lucide Sun/Moon 按鈕，切換 mode。`viz/theme.ts` 已 observe class mutation，圖表主題自動跟隨，無需額外接線。

## 資料流 / 不變式

- 無 Aggregates 形狀變更 → `useDataStore` persist version **不 bump**。
- 純函式 parser/join/aggregate 不動。
- 全域 filter 狀態（`FilterBar`）在 root layout 常駐，跨頁一致（決策 2 的動機）。

## 測試

- 既有卡片 / option builder 測試不受影響。
- 新增：
  - `theme-toggle`：切換後 `documentElement` class 正確（light↔dark↔system），mode 持久化。
  - route 元件 smoke：有資料時該頁預期卡片出現；無資料時 `__root` 渲染 `ImportPanel`。用 `@testing-library/react` + memory router / router harness。
- `vitest.setup.ts` 已 mock `matchMedia`，theme 測試可用。

## 風險 / gotcha

- **gen file 與 build 順序**：見上，提交 `routeTree.gen.ts` 解決。
- **tsconfig**：solution-style；確認 app tsconfig 有含 `src/routeTree.gen.ts`（在 `src` glob 內即可），`tsc -b` 能檢查。
- **StrictMode + router**：`createRouter` 建一次（module scope），避免每 render 重建。
- **YAGNI**：route 元件不抽象、不預留巢狀；3 頁扁平即可。theme store 不做多主題，只 light/dark/system。

## 交付範圍（不做）

- 不引入 URL query 同步 filter（filter 仍走既有 store）。
- 不做 per-project 動態 route（`/projects/$id`）。
- 不改任何圖表 / 聚合邏輯。
