import 'fake-indexeddb/auto'
import { expect, test, beforeEach } from 'vitest'
import { gzipSync, strToU8 } from 'fflate'
import { importBundle } from './importBundle'
import { useDataStore } from '../store/useDataStore'
import { eventsBySession } from '../store/rawDb'
import { SAMPLE_BUNDLE } from '../domain/fixtures/bundle.sample'

beforeEach(() => useDataStore.getState().reset())

test('importBundle populates aggregate store + raw db', async () => {
  const bytes = gzipSync(strToU8(JSON.stringify(SAMPLE_BUNDLE)))
  const { coverage } = await importBundle(bytes, '2026-07-10')
  expect(coverage.matchedSessions).toBe(1)
  expect(useDataStore.getState().aggregates?.kpis.totalCost).toBe(3.0)
  expect(await eventsBySession('sess-A')).toHaveLength(2)
})
