// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { renderHook, waitFor, act, render } from '@testing-library/react'
import { expect, test, beforeEach } from 'vitest'
import { useFilteredEventCards } from './useFilteredEventCards'
import { useFilterStore } from './useFilterStore'
import { useDataStore } from '../../store/useDataStore'
import { saveEvents } from '../../store/rawDb'
import { buildAggregates } from '../../aggregate'
import { SAMPLE_BUNDLE } from '../../domain/fixtures/bundle.sample'

beforeEach(async () => {
  useFilterStore.setState({ preset: 'all' })
  const { aggregates, coverage, costed } = buildAggregates(SAMPLE_BUNDLE, '2026-07-10')
  await saveEvents(costed)
  useDataStore.getState().setResult({ aggregates, coverage, generatedAt: 'x' })
})

test('all → uses precomputed aggregates (sync, not loading)', () => {
  const { result } = renderHook(() => useFilteredEventCards())
  expect(result.current.loading).toBe(false)
  expect(result.current.projectRanking).toEqual(useDataStore.getState().aggregates!.projectRanking)
})

test('non-all → recomputes from IndexedDB', async () => {
  useFilterStore.setState({ preset: '90d' })
  const { result } = renderHook(() => useFilteredEventCards())
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(Array.isArray(result.current.projectRanking)).toBe(true)
})

test('all → 90d transition never flashes empty (shows last-known-good)', async () => {
  useFilterStore.setState({ preset: 'all' })
  const seen: number[] = []
  function Probe() {
    const r = useFilteredEventCards()
    seen.push(r.projectRanking.length)
    return null
  }
  render(<Probe />)
  act(() => {
    useFilterStore.setState({ preset: '90d' })
  })
  // no render observed projectRanking.length === 0 while data exists
  expect(seen.every((n) => n > 0)).toBe(true)
})
