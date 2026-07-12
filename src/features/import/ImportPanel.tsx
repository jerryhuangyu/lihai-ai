import { useState } from 'react'
import { importViaWorker } from '../../import/importViaWorker'
import { bundleScriptUrl, exportCommand, EXPORT_HINT } from '../../export/exportCommand'

export function ImportPanel() {
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const scriptUrl = bundleScriptUrl()
  const command = exportCommand(scriptUrl)

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

  async function copy() {
    await navigator.clipboard.writeText(command)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-4">
      <div className="bg-muted/40 rounded-lg border p-4 text-sm">
        <p className="mb-2 font-medium">第一步：在終端機貼上執行</p>
        <div className="flex items-start gap-2">
          <pre className="bg-background flex-1 overflow-x-auto rounded border p-2 font-mono text-xs">
            {command}
          </pre>
          <button
            type="button"
            onClick={copy}
            className="hover:bg-muted rounded border px-2 py-1 text-xs whitespace-nowrap"
          >
            {copied ? '已複製' : '複製'}
          </button>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">{EXPORT_HINT}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          沒有 curl？也可{' '}
          <a className="text-primary underline" href={scriptUrl} download>
            下載腳本
          </a>{' '}
          後手動執行。
        </p>
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
          {busy ? '解析中…' : '~/lihai-bundle.json.gz'}
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
