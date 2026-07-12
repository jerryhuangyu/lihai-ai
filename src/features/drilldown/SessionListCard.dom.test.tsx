// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { render, screen, fireEvent } from '@testing-library/react'
import { expect, test, beforeEach, vi } from 'vitest'
import { SessionListCard } from './SessionListCard'
import { useDataStore } from '../../store/useDataStore'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

// SessionDetail renders an EChart; canvas isn't available in jsdom, so stub it
// out here to keep this a pure list+selection test.
vi.mock('../../viz/EChart', () => ({ EChart: () => null }))

beforeEach(() => {
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('lists sessions and selects one on click', () => {
  render(<SessionListCard />)
  const row = screen.getByRole('button', { name: /app/ })
  fireEvent.click(row)
  expect(screen.getByText(/則訊息|載入中/)).toBeTruthy()
})

test('does not crash on a stale aggregate missing sessionSummaries', () => {
  // Simulates a pre-2c-5 aggregate blob rehydrated from localStorage: the object
  // is non-null but the sessionSummaries field does not exist yet.
  const { aggregates, coverage } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  const stale = { ...aggregates } as Record<string, unknown>
  delete stale.sessionSummaries
  useDataStore.getState().setResult({
    aggregates: stale as unknown as typeof aggregates,
    coverage,
    generatedAt: 'x',
  })
  render(<SessionListCard />)
  expect(screen.getByText(/尚無資料/)).toBeTruthy()
})
