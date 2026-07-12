import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Project Pages 服務在子路徑 https://<user>.github.io/lihai-ai/。
  // 資產與 router basepath 都以此為根。
  base: '/lihai-ai/',
  plugins: [
    // 排除 route 目錄下的測試檔（*.test.tsx / *.dom.test.tsx），否則 plugin 會對
    // 它們發「does not export a Route」warning。
    tanstackRouter({ target: 'react', autoCodeSplitting: true, routeFileIgnorePattern: '\\.test\\.' }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
