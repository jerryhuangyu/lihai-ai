import { gunzipSync, strFromU8 } from 'fflate'
import type { Bundle } from '../domain/types'

export class BundleError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BundleError'
  }
}

const SUPPORTED_VERSION = 1

export function parseBundle(bytes: Uint8Array): Bundle {
  let text: string
  try {
    text = strFromU8(gunzipSync(bytes))
  } catch {
    throw new BundleError('無法解壓 bundle（不是有效的 gzip 檔）')
  }

  let obj: unknown
  try {
    obj = JSON.parse(text)
  } catch {
    throw new BundleError('bundle 內容不是有效 JSON')
  }

  if (typeof obj !== 'object' || obj === null) {
    throw new BundleError('bundle 格式錯誤')
  }
  const b = obj as Partial<Bundle>
  if (b.v !== SUPPORTED_VERSION) {
    throw new BundleError(`不支援的 bundle version：${String(b.v)}（需要 ${SUPPORTED_VERSION}）`)
  }
  if (!Array.isArray(b.sessions)) {
    throw new BundleError('bundle 缺少 sessions')
  }
  if (typeof b.ccusage !== 'object' || b.ccusage === null) {
    throw new BundleError('bundle 缺少 ccusage')
  }
  return b as Bundle
}
