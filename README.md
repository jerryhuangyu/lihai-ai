# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## LLM 價目資料（pricing）

`src/pricing/rates.json` 是 app 唯一保留的價目表（每個 model、每種 token 類型的 list price，$/1M）。它用來在 ccusage 推導的有效（blended）成本旁邊，顯示真實 list price（output / input / cache-read / cache-creation）。**其餘成本一律以 ccusage 為來源**。

資料來源為 [LiteLLM 社群價目 DB](https://github.com/BerriAI/litellm)，由 `scripts/update-prices.mjs` 快照。

手動刷新：

```bash
pnpm update-prices
```

刷新後 commit 產生的 diff。

### 自動刷新

`.github/workflows/update-prices.yml` 於每週一 03:00 UTC 自動執行（亦可在 Actions 頁面手動 `workflow_dispatch`）：跑 `pnpm update-prices`，若 `rates.json` 有變動則自動開一支 `chore/update-prices` PR（無變動則不開）。review 後 squash-merge，merge 進 `main` 才觸發 `deploy.yml` 部署上線。

走 PR 而非直接 commit `main`：保留 review gate；且以預設 `GITHUB_TOKEN` 直接 push `main` 不會觸發其他 workflow（GitHub 防遞迴），改由 merge 這個一般 push 觸發部署。
