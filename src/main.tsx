import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createRouter, RouterProvider } from '@tanstack/react-router'
import './index.css'
import { routeTree } from './routeTree.gen'
import { applyTheme, useThemeStore } from './store/useThemeStore'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register { router: typeof router }
}

// 首屏保險：localStorage 的 persist rehydrate 是同步的，onRehydrateStorage
// 已會套用主題，但這行讓相依關係明確，不倚賴 middleware 執行順序。
applyTheme(useThemeStore.getState().mode)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
