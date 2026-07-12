# 多頁面 Shell（TanStack Router）實作計劃

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development。逐 task 派 fresh subagent（TDD），task 間 review。步驟用 `- [ ]` 追蹤。

**Goal:** 把單頁 Dashboard 拆成 3 個 TanStack Router file-based 頁面，移除 @efferd 死 chrome，header 右側加 dark mode 切換。

**Architecture:** file-based routing（`src/routes/`）；`__root.tsx` 收 shell + 無資料 guard + 持久列；3 頁 route 僅組合既有卡片。sidebar/header 重寫成真連結 + 主題鈕。

**Tech Stack:** `@tanstack/react-router` + `@tanstack/router-plugin`（Vite）；zustand persist（主題）；Base UI shadcn shell；pnpm。

## Global Constraints

- 繁中（台灣）文案與註解；無 emoji；技術識別字英文。
- pnpm，不用 npm。
- 型別檢查用 `pnpm build`（`tsc -b && vite build`），非裸 `tsc --noEmit`。
- **不 bump** `useDataStore` persist version（Aggregates 形狀不變）。主題 store 用獨立 persist key。
- Dark mode 走 `document.documentElement` 的 `.dark`/`.light` class（`viz/theme.ts` 已 observe），不用 data-theme。
- `src/routeTree.gen.ts` **提交進 git**（build 先跑 `tsc -b`，缺檔會失敗）。
- 純函式 parser/join/aggregate、圖表/聚合邏輯一律不動。
- 卡片元件不抽象、route 不預留巢狀（YAGNI）。

---

### Task 1: Router 基礎（deps + plugin + 單一 route 骨架）

目標：導入 router，`/` 顯示與現況完全相同的 Dashboard，app 保持 green。

**Files:**
- Modify: `package.json`（deps）、`vite.config.ts`
- Create: `src/routes/__root.tsx`、`src/routes/index.tsx`、`src/routeTree.gen.ts`（生成後提交）
- Modify: `src/main.tsx`
- Delete: `src/App.tsx`

**Interfaces:**
- Produces: `Route`（各 route module export）、`routeTree`（gen）、`router`（main）。
- `__root.tsx` 提供 shell + `<Outlet/>`；`index.tsx` 目前直接 render 既有 `<Dashboard/>`。

- [ ] **Step 1: 裝 deps**

```bash
pnpm add @tanstack/react-router
pnpm add -D @tanstack/router-plugin
```

- [ ] **Step 2: vite.config.ts 加 plugin（放 react() 前）**

```ts
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
```

- [ ] **Step 3: `src/routes/__root.tsx`（shell + Outlet）**

搬 `AppShell` 組成進來，content 放 `<Outlet/>`。`TooltipProvider` 移到這裡。

```tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppHeader } from '@/components/app-header'
import { AppSidebar } from '@/components/app-sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export const Route = createRootRoute({ component: RootLayout })

function RootLayout() {
  return (
    <TooltipProvider>
      <SidebarProvider className={cn('[--app-wrapper-max-width:80rem]')}>
        <AppSidebar />
        <SidebarInset>
          <AppHeader />
          <div className={cn('flex flex-1 flex-col p-4 md:p-6', 'mx-auto w-full max-w-(--app-wrapper-max-width)')}>
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
```

- [ ] **Step 4: `src/routes/index.tsx`（暫時 render 既有 Dashboard）**

```tsx
import { createFileRoute } from '@tanstack/react-router'
import { Dashboard } from '@/features/dashboard/Dashboard'

export const Route = createFileRoute('/')({ component: Dashboard })
```

- [ ] **Step 5: 生成 routeTree.gen.ts**

Run: `pnpm exec vite build`（plugin 於 buildStart 生成 `src/routeTree.gen.ts`；build 是否完成不重要，檔案已寫）。確認檔案存在。

- [ ] **Step 6: `src/main.tsx` wire RouterProvider**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- [ ] **Step 7: 刪 `src/App.tsx`**

- [ ] **Step 8: 驗證 + commit**

Run: `pnpm build`（green）、`pnpm test`（全過）。手動：`pnpm dev` → `/` 顯示與原本相同（sidebar/header/所有卡）。
Commit（含 `src/routeTree.gen.ts`）：`feat(router): introduce TanStack Router, single route renders dashboard`

---

### Task 2: 拆 3 頁 + 持久列上移 root

**Files:**
- Modify: `src/routes/__root.tsx`（guard + 持久列）、`src/routes/index.tsx`
- Create: `src/routes/analysis.tsx`、`src/routes/sessions.tsx`
- Delete: `src/features/dashboard/Dashboard.tsx`（+ 對應 test，若有則改寫成 route 測試於 Task 5）
- Modify: `src/routeTree.gen.ts`（重生成）

**Interfaces:**
- Consumes: 既有卡片元件、`DashboardGrid`、`KpiRow`、`FilterBar`、`ImportPanel`、`useHasData`、`useDataStore`。
- `__root` 在 `hasData` 時渲染 持久列 + `<Outlet/>`；否則 `<ImportPanel/>`。

- [ ] **Step 1: `__root.tsx` content 加 guard + 持久列**

content 區改為：

```tsx
import { ImportPanel } from '@/features/import/ImportPanel'
import { FilterBar } from '@/features/filter/FilterBar'
import { useHasData } from '@/ui/selectors'
import { useDataStore } from '@/store/useDataStore'
// ...
function Content() {
  const hasData = useHasData()
  const coverage = useDataStore((s) => s.coverage)
  const generatedAt = useDataStore((s) => s.generatedAt)
  const reset = useDataStore((s) => s.reset)
  if (!hasData) return <div className="py-8"><ImportPanel /></div>
  const covPct = coverage ? Math.round((coverage.matchedCost / (coverage.totalCost || 1)) * 100) : 0
  return (
    <div className="flex flex-col gap-4">
      <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 text-xs">
        <span>成本歸屬涵蓋率 {covPct}%{generatedAt && ` · 匯出於 ${new Date(generatedAt).toLocaleString()}`}</span>
        <div className="flex items-center gap-3">
          <FilterBar />
          <button className="hover:text-foreground underline" onClick={reset}>重新匯入</button>
        </div>
      </div>
      <Outlet />
    </div>
  )
}
```

`RootLayout` 的 content wrapper 內用 `<Content />` 取代 `<Outlet/>`。

- [ ] **Step 2: `index.tsx` = 總覽（KpiRow + 成本 + 用量組成）**

component 渲染：`<KpiRow/>`；段「成本」grid（`DailyCostCard`/`ProjectionCard`/`WhyTodayCard`/`CostByTokenTypeCard`）；段「用量組成」grid（`TokenCompositionCard`/`ModelTimelineCard`/`ModelEfficiencyCard`）。段落結構沿用 `Dashboard.tsx` 的 `<div className="flex flex-col gap-3"><h2 …>…</h2><DashboardGrid>…</DashboardGrid></div>`。頂層包 `<div className="flex flex-col gap-4">`。

- [ ] **Step 3: `analysis.tsx` = 分析（專案與時段 + 效率與分布）**

`createFileRoute('/analysis')`。段「專案與時段」（`ProjectRankingCard`/`HourHeatmapCard`）；段「效率與分布」（`CacheTrendCard`/`SessionDistCard`/`AgentShareCard`）。

- [ ] **Step 4: `sessions.tsx` = Session 明細**

`createFileRoute('/sessions')`。段「Session 明細」（`SessionListCard`）。

- [ ] **Step 5: 刪 `Dashboard.tsx`**

若存在 `Dashboard.dom.test.tsx` 之類 → 該 task 一併移除或標記，route 測試於 Task 5 補。移除後確認無 import 殘留。

- [ ] **Step 6: 重生成 gen + 驗證 + commit**

Run: `pnpm exec vite build`（重生成 gen）、`pnpm build`、`pnpm test`。手動：`/`、`/analysis`、`/sessions` 各顯示正確段落；持久列跨頁常駐；`/analysis` 頁無 KpiRow。
Commit：`feat(router): split dashboard into overview/analysis/sessions pages`

---

### Task 3: Sidebar 重寫（3 真連結，清死項）

**Files:**
- Modify: `src/components/app-shared.tsx`、`src/components/app-sidebar.tsx`
- Delete: `src/components/latest-change.tsx`、`src/components/nav-group.tsx`（改扁平 menu）

**Interfaces:**
- Produces: `navItems: { title; to; icon }[]`（3 項），供 sidebar 與 header breadcrumb 共用。

- [ ] **Step 1: `app-shared.tsx` 換 nav data**

移除 `navGroups`/`footerNavLinks`/`navLinks`/`SidebarNavGroup`。新：

```tsx
import type { ReactNode } from 'react'
import { LayoutGridIcon, BarChart3Icon, ListIcon } from 'lucide-react'

export type SidebarNavItem = { title: string; to: string; icon: ReactNode }

export const navItems: SidebarNavItem[] = [
  { title: '總覽', to: '/', icon: <LayoutGridIcon /> },
  { title: '分析', to: '/analysis', icon: <BarChart3Icon /> },
  { title: 'Session', to: '/sessions', icon: <ListIcon /> },
]
```

- [ ] **Step 2: `app-sidebar.tsx` 用 TanStack Link 渲染 3 項**

- 移除 `LatestChange`、footer 死連結、`NavGroup`。
- brand header 文字改「AI Usage」，`render={<Link to="/" />}`（或非連結 `<span>`）。
- nav：`SidebarMenu` map `navItems`，每項 `SidebarMenuButton render={<Link to={item.to} />}`；active 用 TanStack `Link` 的 `activeProps`／`activeOptions={{ exact: item.to === '/' }}` 設 `data-active` 或 class。範例：

```tsx
import { Link } from '@tanstack/react-router'
// ...
<SidebarMenuItem key={item.to}>
  <SidebarMenuButton render={
    <Link to={item.to} activeOptions={{ exact: item.to === '/' }} activeProps={{ 'data-active': 'true' }} />
  }>{item.icon}<span>{item.title}</span></SidebarMenuButton>
</SidebarMenuItem>
```

（若 `SidebarMenuButton` 的 active 樣式吃 `isActive` prop 而非 `data-active`，改用 `useMatchRoute`/`useLocation` 求 active 再傳 `isActive`——重寫時對齊元件實作。）

- 保留 `© {year}` 版權可改為 app 名或移除（最小改動：留著、文字改中性）。

- [ ] **Step 3: 驗證 + commit**

Run: `pnpm build`、`pnpm test`。手動：sidebar 只剩 3 項、可點切頁、當前頁 highlight；無 changelog、無 footer 死連結。
Commit：`feat(sidebar): real 3-page nav via TanStack Link, remove dead chrome`

---

### Task 4: Header 重寫 + dark mode 切換

**Files:**
- Create: `src/store/useThemeStore.ts`、`src/components/theme-toggle.tsx`、`src/store/useThemeStore.test.ts`、`src/components/theme-toggle.dom.test.tsx`
- Modify: `src/components/app-header.tsx`、`src/main.tsx`（啟動套用主題）
- Delete: `src/components/nav-user.tsx`

**Interfaces:**
- Produces: `useThemeStore`（`mode: 'light'|'dark'|'system'`, `setMode`, `cycle`）、`applyTheme(mode)`、`<ThemeToggle/>`。

- [ ] **Step 1: 寫失敗測試 `useThemeStore.test.ts`**

斷言：`applyTheme('dark')` → `documentElement.classList` 含 `dark` 不含 `light`；`applyTheme('light')` → 含 `light` 不含 `dark`；`applyTheme('system')` → 兩者皆無。`setMode` 更新 store。

- [ ] **Step 2: `useThemeStore.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ThemeMode = 'light' | 'dark' | 'system'

export function applyTheme(mode: ThemeMode) {
  const el = document.documentElement
  el.classList.remove('dark', 'light')
  if (mode === 'dark') el.classList.add('dark')
  else if (mode === 'light') el.classList.add('light')
  // system: 兩者皆不加，回落 prefers-color-scheme
}

interface ThemeState {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
  cycle: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'system',
      setMode: (mode) => { applyTheme(mode); set({ mode }) },
      cycle: () => {
        const order: ThemeMode[] = ['system', 'light', 'dark']
        const next = order[(order.indexOf(get().mode) + 1) % order.length]
        applyTheme(next); set({ mode: next })
      },
    }),
    {
      name: 'cc-dashboard-theme',
      onRehydrateStorage: () => (state) => { if (state) applyTheme(state.mode) },
    },
  ),
)
```

- [ ] **Step 3: `theme-toggle.tsx`**

lucide `SunIcon`/`MoonIcon`/`MonitorIcon` 依 mode 顯示，`onClick={cycle}`，`aria-label` 述目前主題。用既有 `Button size="icon-sm" variant="outline"`。

- [ ] **Step 4: `theme-toggle.dom.test.tsx`**

render → 點擊循環 mode → 斷言 class 依序變化（system→light→dark→system）。

- [ ] **Step 5: `app-header.tsx` 重寫右側**

- 移除 `SendIcon`/`BellIcon` 兩顆 Button、`NavUser`、`navLinks` import。
- 右側改 `<ThemeToggle />`。
- Breadcrumb：由當前 route 求標題。用 `useMatchRoute` 或比對 `useLocation().pathname` 對 `navItems` 找 title/icon，傳給 `AppBreadcrumbs`。範例：

```tsx
import { useLocation } from '@tanstack/react-router'
import { navItems } from '@/components/app-shared'
// ...
const { pathname } = useLocation()
const page = navItems.find((i) => (i.to === '/' ? pathname === '/' : pathname.startsWith(i.to))) ?? navItems[0]
```

- [ ] **Step 6: `main.tsx` 啟動套用主題**

rehydrate 已於 store `onRehydrateStorage` 套用；保險：main 在 render 前呼叫一次 `applyTheme(useThemeStore.getState().mode)`。

- [ ] **Step 7: 刪 `nav-user.tsx`**

- [ ] **Step 8: 驗證 + commit**

Run: `pnpm build`、`pnpm test`（含新主題測試）。手動：header 右側只剩主題鈕、可循環 system/light/dark、圖表配色跟著變；無 Bell/Send/假人。
Commit：`feat(header): dark-mode toggle, remove dead notification/user chrome`

---

### Task 5: Route smoke 測試 + 收尾 + 整枝 review

**Files:**
- Create: `src/routes/index.dom.test.tsx`、`src/routes/analysis.dom.test.tsx`、`src/routes/sessions.dom.test.tsx`、`src/routes/__root.dom.test.tsx`（或合併一檔）
- Modify: 任何殘留 dead import / dead code

**Interfaces:** 無新 export。

- [ ] **Step 1: Route smoke 測試**

用 `@testing-library/react` + TanStack `createRouter` + `createMemoryHistory` 或直接 render route component（若 component 不依賴 router context 可直接 render）。斷言：
- 有資料（mock store）時 `index` component 出現「成本」「用量組成」標題與代表卡；`analysis` 出現「專案與時段」「效率與分布」；`sessions` 出現「Session 明細」。
- 無資料時 `__root` Content 渲染 ImportPanel（可測 Content 函式或整合 render）。
- 直接 render route component 較簡；若需 router harness 參考既有 dom test 的 store mock 方式。

- [ ] **Step 2: 掃 dead code**

`grep` 確認無殘留引用：`navLinks`、`navGroups`、`footerNavLinks`、`NavUser`、`LatestChange`、`NavGroup`、`App.tsx`。移除孤兒。

- [ ] **Step 3: 驗證 + commit**

Run: `pnpm build`、`pnpm test`。
Commit：`test(router): route smoke tests, dead-code sweep`

- [ ] **Step 4: 整枝 review**

派 final code-reviewer 掃整個 `feat/multipage-router` 分支 diff。修 Critical/Important。

---

## Self-Review 檢核

- Spec 對應：3 頁拆分（T2）、死 chrome 清理（T3/T4）、dark toggle（T4）、持久列（T2）、gen file 提交（T1）—覆蓋。
- 型別一致：`navItems`（T3 定義）供 T4 header 消費，欄位 `{title,to,icon}` 一致。
- 無 placeholder：各 task 有具體 code 或明確檔案清單。
- persist version 不 bump（無 Aggregates 變更）；主題獨立 key。
