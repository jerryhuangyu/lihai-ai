/** Command the UI shows next to a "下載 build-bundle.mjs" button. The user
 *  downloads the generator (served as a static asset by the app), then runs it.
 *  It writes ~/cc-usage-bundle.json.gz to drag back into the app. */
export const EXPORT_COMMAND = 'node ~/Downloads/build-bundle.mjs'

export const EXPORT_HINT =
  '1. 下載 build-bundle.mjs　2. 於終端機執行上面指令　3. 產生 ~/cc-usage-bundle.json.gz 後拖進本頁'
