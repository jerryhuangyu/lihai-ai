import { useState } from 'react'
import { importViaWorker } from '../../import/importViaWorker'
import { EXPORT_COMMAND, EXPORT_HINT } from '../../export/exportCommand'

export function ImportPanel() {
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handle(file: File) {
    setErr(null)
    if (!file.name.endsWith('.gz')) {
      setErr('請上傳一鍵指令產生的 .gz bundle 檔')
      return
    }
    setBusy(true)
    try {
      await importViaWorker(file, new Date().toISOString().slice(0, 10))
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="bg-muted/40 rounded-lg border p-4 text-sm">
        <p className="mb-2 font-medium">第一步：在終端機產生 bundle</p>
        <ol className="text-muted-foreground mb-3 list-decimal space-y-1 pl-5">
          <li>
            <a className="text-primary underline" href="/build-bundle.mjs" download>
              下載 build-bundle.mjs
            </a>
          </li>
          <li>執行下面指令</li>
        </ol>
        <pre className="bg-background overflow-x-auto rounded border p-2 font-mono text-xs">
          {EXPORT_COMMAND}
        </pre>
        <p className="text-muted-foreground mt-2 text-xs">{EXPORT_HINT}</p>
      </div>

      <label
        className="hover:bg-muted/30 flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          const f = e.dataTransfer.files?.[0]
          if (f) handle(f)
        }}
      >
        <span className="font-medium">第二步：拖拉或選擇 bundle 檔</span>
        <span className="text-muted-foreground text-xs">
          {busy ? '解析中…' : '~/cc-usage-bundle.json.gz'}
        </span>
        <input
          type="file"
          accept=".gz"
          className="sr-only"
          aria-label="上傳 bundle"
          onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
        />
      </label>

      {err && <p className="text-destructive text-sm">{err}</p>}
    </div>
  )
}
