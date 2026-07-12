// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { expect, test, vi, beforeEach } from 'vitest'
import { buildAggregates } from '../aggregate'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'
import { useDataStore } from '../store/useDataStore'
import { eventsBySession } from '../store/rawDb'

// jsdom lacks real Workers; stub Worker to synchronously reply with computed data.
class FakeWorker {
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  postMessage() {
    const { aggregates, costed, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
    this.onmessage?.({ data: { ok: true, aggregates, costed, coverage, generatedAt: 'x' } } as MessageEvent)
  }
  terminate() {}
}

beforeEach(() => useDataStore.getState().reset())

test('importViaWorker persists worker reply to store + db', async () => {
  vi.stubGlobal('Worker', FakeWorker as unknown as typeof Worker)
  const { importViaWorker } = await import('./importViaWorker')
  const file = { arrayBuffer: async () => new ArrayBuffer(8) } as unknown as File
  const coverage = await importViaWorker(file, '2026-07-10')
  expect(coverage.matchedSessions).toBe(1)
  expect(useDataStore.getState().aggregates?.kpis.totalCost).toBe(3.0)
  expect(await eventsBySession('sess-A')).toHaveLength(2)
})
