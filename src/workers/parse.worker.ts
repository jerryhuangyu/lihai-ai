import { parseBundle } from '../parsers/bundle'
import { buildAggregates } from '../aggregate'

self.onmessage = (e: MessageEvent<{ bytes: ArrayBuffer; todayIso: string; tzOffsetMinutes: number }>) => {
  try {
    const bundle = parseBundle(new Uint8Array(e.data.bytes))
    const { aggregates, costed, coverage } = buildAggregates(bundle, e.data.todayIso, e.data.tzOffsetMinutes)
    ;(self as unknown as Worker).postMessage({
      ok: true,
      aggregates,
      costed,
      coverage,
      generatedAt: bundle.generatedAt,
    })
  } catch (err) {
    ;(self as unknown as Worker).postMessage({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
